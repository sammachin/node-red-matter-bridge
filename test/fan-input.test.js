const assert = require('node:assert/strict');
const test = require('node:test');
const { createNode, fanDevice, settle } = require('./helpers');

function fan() {
    const node = createNode('../fan');
    node.device = fanDevice();
    node.emit('serverReady');
    return node;
}

for (const key of ['percent', 'level']) {
    test(`fan accepts payload.${key} without a light state property (#80)`, async () => {
        const node = fan();
        node.receive({ payload: { [key]: 45 } });
        await settle();
        assert.equal(node.errors.length, 0);
        assert.equal(node.device.state.fanControl.percentSetting, 45);
        assert.equal(node.device.state.fanControl.fanMode, 1);
        assert.equal(node.device.state.fanControl.airflowDirection, 0);
        assert.equal(node.device.state.fanControl.rockSetting.rockLeftRight, false);
    });
}

test('fan prefers percent when both percentage aliases are provided', async () => {
    const node = fan();
    node.receive({ payload: { percent: 30, level: 70 } });
    await settle();
    assert.equal(node.device.state.fanControl.percentSetting, 30);
});

test('fan supports mode, direction and rock without requiring a light state', async () => {
    const node = fan();
    node.receive({ payload: { mode: 3, direction: 1, rock: true } });
    await settle();
    assert.equal(node.errors.length, 0);
    assert.deepEqual(node.device.state.fanControl, {
        fanMode: 3, percentSetting: 20, airflowDirection: 1, rockSetting: { rockLeftRight: true }
    });
});

test('fan handles malformed payloads without throwing', () => {
    for (const payload of [null, undefined, 45, '45', []]) {
        const node = fan();
        assert.doesNotThrow(() => node.receive({ payload }));
        assert.equal(node.errors.length, 1);
        assert.equal(node.device.updates.length, 0);
    }
});

test('fan clamps percentage step changes at the supported limits', async () => {
    const node = fan();
    node.device.state.fanControl.percentSetting = 95;
    node.receive({ payload: { increaseLevel: true } });
    await settle();
    assert.equal(node.device.state.fanControl.percentSetting, 100);
    node.device.state.fanControl.percentSetting = 5;
    node.receive({ payload: { decreaseLevel: true } });
    await settle();
    assert.equal(node.device.state.fanControl.percentSetting, 0);
});
