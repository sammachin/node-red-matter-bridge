const assert = require('node:assert/strict');
const test = require('node:test');
const { willUpdate, clampName, MAX_NAME_LENGTH } = require('../utils');

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

test('clampName truncates over-length names to the Matter limit', () => {
    const longName = 'Aussenfühler Norden, Aussenthermostat Norden';
    assert.ok(longName.length > MAX_NAME_LENGTH);
    assert.equal(clampName(longName).length, MAX_NAME_LENGTH);
    assert.equal(clampName(longName), longName.substring(0, MAX_NAME_LENGTH));
});

test('clampName leaves valid names and non-strings untouched', () => {
    assert.equal(clampName('Living Room'), 'Living Room');
    assert.equal(clampName(''), '');
    assert.equal(clampName('x'.repeat(MAX_NAME_LENGTH)).length, MAX_NAME_LENGTH);
    assert.equal(clampName(undefined), undefined);
    assert.equal(clampName(null), null);
});
