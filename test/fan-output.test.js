const assert = require('node:assert/strict');
const test = require('node:test');
const { createNode, fanDevice, settle } = require('./helpers');

function fan(config) {
    const node = createNode('../fan', config);
    node.device = fanDevice();
    node.emit('serverReady');
    return node;
}

test('fan emits controller percentage changes (#83)', async () => {
    const node = fan({ passthrough: 'false' });
    await node.device.set({ fanControl: { percentSetting: 45 } });
    assert.equal(node.output.length, 1);
    assert.equal(node.output[0].payload.percent, 45);
});

test('unchanged input does not suppress the next controller percentage change (#83)', async () => {
    const node = fan({ passthrough: 'false' });
    node.receive({ payload: { state: true, mode: 1, percent: 20, direction: 0, rock: false } });
    await settle();
    assert.equal(node.output.length, 0);
    await node.device.set({ fanControl: { percentSetting: 45 } });
    assert.equal(node.output.length, 1);
    assert.equal(node.output[0].payload.percent, 45);
});

test('fan passthrough reads rocking state from the endpoint state (#83)', async () => {
    const node = fan();
    node.receive({ payload: { state: true, percent: 45 } });
    await settle();
    assert.equal(node.errors.length, 0);
    assert.equal(node.output.length, 1);
    assert.equal(node.output[0].payload.percent, 45);
    assert.equal(node.output[0].payload.rock, false);
});
