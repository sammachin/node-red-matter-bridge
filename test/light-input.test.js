const assert = require('node:assert/strict');
const test = require('node:test');
const { createNode, settle } = require('./helpers');
const { createMatterBridge } = require('./matter-helper');

async function light(t, type, config = {}) {
    const aggregator = await createMatterBridge(t);
    const node = createNode(`../${type}`, { range: '254', tempformat: 'kelvin', ...config });
    node.device = require(`../devices/${type}`)[type]({ id: node.id, name: 'Test light', bat: false });
    await aggregator.add(node.device);
    node.emit('serverReady');
    const set = node.device.set.bind(node.device);
    const updates = [];
    node.device.set = data => {
        const update = set(data);
        updates.push(update);
        return update;
    };
    node.input = async payload => {
        node.receive({ payload });
        await Promise.all(updates.splice(0).map(p => p.catch(() => {})));
        await settle();
    };
    return node;
}

for (const type of ['dimmablelight', 'colortemplight', 'fullcolorlight']) {
    test(`${type} clamps brightness and warns in the configured units`, async t => {
        const node = await light(t, type, { range: '100' });
        await node.input({ level: 236 });
        assert.equal(node.device.state.levelControl.currentLevel, 254);
        assert.equal(node.output.at(-1).payload.level, 100);
        assert.equal(node.warnings.length, 1);
        assert.match(node.warnings[0], /Clamped payload.level from 236 to 100 %/);
        // Even an unchanged endpoint must forward the clamped value, not 236%.
        await node.input({ level: 236 });
        assert.equal(node.output.at(-1).payload.level, 100);
        await node.input({ level: 50 });
        assert.equal(node.device.state.levelControl.currentLevel, 127);
        assert.equal(node.output.at(-1).payload.level, 50);
        assert.equal(node.warnings.length, 2);
        await node.input({ level: -5 });
        assert.equal(node.output.at(-1).payload.level, 1);
        assert.match(node.warnings.at(-1), /payload.level from -5 to 1 %/);
        assert.equal(node.errors.length, 0);
    });

    test(`${type} preserves the 254 scale and clamps both step boundaries`, async t => {
        const node = await light(t, type);
        await node.input({ level: 236 });
        assert.equal(node.output.at(-1).payload.level, 236);
        assert.equal(node.warnings.length, 0);
        await node.input({ level: 250 });
        await node.input({ increaseLevel: true });
        assert.equal(node.device.state.levelControl.currentLevel, 254);
        await node.input({ level: 1 });
        await node.input({ decreaseLevel: true });
        assert.equal(node.device.state.levelControl.currentLevel, 1);
        assert.equal(node.warnings.length, 2);
        assert.equal(node.errors.length, 0);
    });

    test(`${type} rejects invalid inputs and accepts the next valid message`, async t => {
        const node = await light(t, type);
        for (const payload of [null, [], 'bad', { level: NaN }, { level: Infinity }, { level: '50' }]) {
            await node.input(payload);
        }
        assert.equal(node.errors.length, 6);
        assert.equal(node.warnings.length, 0);
        await node.input({ level: 100 });
        assert.equal(node.device.state.levelControl.currentLevel, 100);
        assert.equal(node.errors.length, 6);
    });

    test(`${type} clears pending state after an update is rejected`, async t => {
        const node = await light(t, type, { passthrough: 'false' });
        node.device.set = () => Promise.reject(new Error('Rejected test update'));
        await node.input({ level: 75 });
        assert.equal(node.pending, false);
        assert.equal(node.pendingmsg, null);
        assert.equal(node.errors.length, 1);
        node.stateEvt(undefined, undefined, { offline: true });
        assert.equal(node.output.length, 1, 'later controller updates must not be suppressed');
    });
}

for (const type of ['colortemplight', 'fullcolorlight']) {
    test(`${type} rounds Kelvin to whole mireds and retains valid cool white`, async t => {
        const node = await light(t, type);
        await node.input({ temp: 6500 });
        assert.equal(node.device.state.colorControl.colorTemperatureMireds, 154);
        await node.input({ temp: 5000 });
        assert.equal(node.device.state.colorControl.colorTemperatureMireds, 200);
        assert.equal(node.output.at(-1).payload.temp, 5000);
        assert.equal(node.errors.length, 0);
        assert.equal(node.warnings.length, 0, 'ordinary rounding is not clamping');
    });

    test(`${type} clamps temperature at both physical limits with warnings`, async t => {
        const node = await light(t, type, { tempformat: 'mired' });
        for (const [input, expected] of [[-5, 1], [100000, 0xFEFF], [200.4, 200]]) {
            await node.input({ temp: input });
            assert.equal(node.device.state.colorControl.colorTemperatureMireds, expected);
            assert.equal(node.output.at(-1).payload.temp, expected);
        }
        assert.equal(node.warnings.length, 2);
        assert.match(node.warnings[0], /payload.temp from -5 to 1 mireds/);
        assert.equal(node.errors.length, 0);
    });

    test(`${type} uses the physical bulb limits when clamping Kelvin`, async t => {
        const node = await light(t, type);
        await node.device.set({ colorControl: {
            colorTempPhysicalMinMireds: 153, colorTempPhysicalMaxMireds: 500,
            coupleColorTempToLevelMinMireds: 153
        } });
        await node.input({ temp: 55 });
        assert.equal(node.device.state.colorControl.colorTemperatureMireds, 500);
        assert.equal(node.output.at(-1).payload.temp, 2000);
        assert.match(node.warnings.at(-1), /payload.temp from 55 to 2000 K/);
        await node.input({ temp: 10000 });
        assert.equal(node.device.state.colorControl.colorTemperatureMireds, 153);
        assert.equal(node.warnings.length, 2);
        assert.equal(node.errors.length, 0);
    });

    test(`${type} clamps zero Kelvin and rejects non-finite temperatures`, async t => {
        const node = await light(t, type);
        await node.input({ temp: 0 });
        assert.equal(node.device.state.colorControl.colorTemperatureMireds, 0xFEFF);
        assert.equal(node.warnings.length, 1);
        await node.input({ temp: Infinity });
        assert.equal(node.errors.length, 1);
        await node.input({ temp: 5000 });
        assert.equal(node.device.state.colorControl.colorTemperatureMireds, 200);
    });

    test(`${type} respects mired units for controller updates and passthrough`, async t => {
        const node = await light(t, type, { tempformat: 'mired', passthrough: 'false' });
        await node.device.set({ colorControl: { colorMode: 2, colorTemperatureMireds: 200 } });
        assert.equal(node.output.at(-1).payload.temp, 200);
        node.passthrough = true;
        await node.input({ temp: 300 });
        assert.equal(node.output.at(-1).payload.temp, 300);
    });
}

test('fullcolorlight clamps hue/saturation, accepts zero, and rejects mixed color modes', async t => {
    const node = await light(t, 'fullcolorlight');
    await node.input({ hue: 400, sat: -10 });
    assert.equal(node.device.state.colorControl.currentHue, 254);
    assert.equal(node.device.state.colorControl.currentSaturation, 0);
    assert.equal(node.warnings.length, 2);
    await node.input({ hue: 0, sat: 100.4 });
    assert.equal(node.device.state.colorControl.currentHue, 0);
    assert.equal(node.device.state.colorControl.currentSaturation, 100);
    await node.input({ temp: 5000, hue: 200 });
    assert.equal(node.errors.length, 1);
    assert.equal(node.device.state.colorControl.currentHue, 0);
});
