const assert = require('node:assert/strict');
const test = require('node:test');
const { createMatterBridge } = require('./matter-helper');
const { createNode, settle } = require('./helpers');
const { fan } = require('../devices/fan');

test('fan input passes actual Matter attribute validation (#80)', async t => {
    const aggregator = await createMatterBridge(t);
    const node = createNode('../fan');
    node.device = fan({ id: node.id, name: 'Test fan', bat: false });
    await aggregator.add(node.device);
    assert.equal(node.device.state.fanControl.rockSetting.rockLeftRight, false);
    node.emit('serverReady');
    node.receive({ payload: { percent: 45 } });
    await settle();
    assert.equal(node.errors.length, 0);
    assert.equal(node.device.state.fanControl.percentSetting, 45);
    assert.equal(node.output.at(-1).payload.percent, 45);
    node.receive({ payload: { mode: 3, level: 70, direction: 1, rock: true } });
    await settle();
    assert.equal(node.errors.length, 0);
    assert.equal(node.device.state.fanControl.fanMode, 3);
    assert.equal(node.device.state.fanControl.percentSetting, 70);
    assert.equal(node.device.state.fanControl.airflowDirection, 1);
    assert.equal(node.device.state.fanControl.rockSetting.rockLeftRight, true);
});
