const assert = require('node:assert/strict');
const test = require('node:test');
const { willUpdate } = require('../utils');

test('willUpdate compares nested Matter attributes', () => {
    const device = { state: { onOff: { onOff: true }, levelControl: { currentLevel: 31 } } };
    assert.equal(willUpdate.call(device, { onOff: { onOff: true } }), false);
    assert.equal(willUpdate.call(device, { onOff: { onOff: false } }), true);
    assert.equal(willUpdate.call(device, { levelControl: { currentLevel: 32 } }), true);
});

test('willUpdate tolerates a cluster missing during initialization (#84)', () => {
    assert.equal(willUpdate.call({ state: {} }, { onOff: { onOff: false } }), true);
    assert.equal(willUpdate.call({ state: { onOff: null } }, { onOff: { onOff: true } }), true);
});

test('willUpdate defers updates until the device state exists', () => {
    assert.equal(willUpdate.call({}, { onOff: { onOff: true } }), false);
});

test('willUpdate reads attribute keys literally without evaluating code', () => {
    const device = { state: { custom: { 'value.with.dots': 4 } } };
    assert.equal(willUpdate.call(device, { custom: { 'value.with.dots': 4 } }), false);
    assert.equal(willUpdate.call(device, { custom: { 'value.with.dots': 5 } }), true);
});
