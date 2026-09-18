const assert = require('node:assert/strict');
const test = require('node:test');
const { createNode } = require('./helpers');

test('thermostat temperature passthrough attaches eventSource to the pending message', () => {
    const node = createNode('../thermostat', { mode: 'heat' });
    node.device = { state: { thermostat: { systemMode: 4, occupiedHeatingSetpoint: 2200 } } };
    node.pending = true;
    node.pendingmsg = { payload: { temperature: 19 }, _msgid: 'original-message' };
    assert.doesNotThrow(() => node.tempEvt(1900, 1800, { offline: true }));
    assert.equal(node.output.length, 1);
    assert.deepEqual(node.output[0].eventSource, { local: true });
    assert.equal(node.output[0]._msgid, 'original-message');
    assert.deepEqual(node.output[0].payload, { mode: 'heat', temperature: 1900, setPoint: 2200 });
    assert.equal(node.pending, false);
});
