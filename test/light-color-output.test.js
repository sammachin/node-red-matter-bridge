const assert = require('node:assert/strict');
const test = require('node:test');
const { createNode, settle } = require('./helpers');
const { createMatterBridge } = require('./matter-helper');

async function light(t, config = {}) {
    const aggregator = await createMatterBridge(t);
    const node = createNode('../fullcolorlight', { range: '254', tempformat: 'kelvin', passthrough: 'false', ...config });
    node.device = require('../devices/fullcolorlight').fullcolorlight({ id: node.id, name: 'Color light', bat: false });
    await aggregator.add(node.device);
    node.emit('serverReady');
    await node.device.set({ onOff: { onOff: true } });
    node.output.length = 0;
    return node;
}

test('XY controller commands emit hue/saturation usable by existing flows', async t => {
    const node = await light(t);
    const command = (x, y) => node.device.act(agent => agent.colorControl.moveToColor({
        colorX: Math.round(x * 65536), colorY: Math.round(y * 65536), transitionTime: 0,
        optionsMask: {}, optionsOverride: {}
    }));
    await command(0.7, 0.3);
    assert.equal(node.device.state.colorControl.colorMode, 1);
    assert.ok(node.output.length > 0, 'XY changes must reach the Node-RED output');
    const red = node.output.at(-1).payload;
    assert.ok(red.hue <= 10 || red.hue >= 244, `Expected red hue, got ${red.hue}`);
    assert.ok(red.sat > 230 && red.sat <= 254);
    assert.equal(red.temp, undefined);
    node.output.length = 0;
    await command(0.17, 0.7);
    const green = node.output.at(-1).payload;
    assert.ok(green.hue >= 60 && green.hue <= 110, `Expected green hue, got ${green.hue}`);
    assert.ok(green.sat > 230 && green.sat <= 254);
    assert.equal(node.errors.length, 0);
});

test('a color mode change emits the selected color even when the coordinates are unchanged', async t => {
    const node = await light(t);
    await node.device.set({ colorControl: { colorMode: 1 } });
    assert.ok(node.output.length > 0);
    assert.ok(Number.isFinite(node.output.at(-1).payload.hue));
    assert.ok(Number.isFinite(node.output.at(-1).payload.sat));
    assert.equal(node.errors.length, 0);
});

test('multi-attribute local updates remain suppressed when passthrough is disabled', async t => {
    const node = await light(t);
    node.receive({ payload: { level: 42, hue: 100, sat: 200 } });
    await settle();
    await settle();
    assert.equal(node.output.length, 0, 'each event in the same local update must remain suppressed');
    assert.equal(node.pending, false);
    await node.device.set({ colorControl: { currentHue: 150 } });
    assert.ok(node.output.length > 0, 'subsequent controller changes must still be forwarded');
});

test('closing the node removes XY and color-mode subscriptions', async t => {
    const node = await light(t);
    await new Promise(resolve => node.emit('close', false, resolve));
    await node.device.set({ colorControl: { colorMode: 1, currentX: 45000, currentY: 20000 } });
    assert.equal(node.output.length, 0);
});
