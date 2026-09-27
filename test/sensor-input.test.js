const assert = require('node:assert/strict');
const test = require('node:test');
const { createMatterBridge } = require('./matter-helper');
const { createNode, settle } = require('./helpers');

// Regression: after the @matter/main 0.16 -> 0.17 bump, OccupancySensorDevice no
// longer ships the OccupancySensing cluster by default, so every occupancy write
// threw "Behavior 'occupancySensing' is not present" and was reported as
// "Invalid Input" for both true and false.
test('occupancy sensor accepts true and false (#occupancy)', async t => {
    const aggregator = await createMatterBridge(t);
    const node = createNode('../occupancysensor');
    node.device = require('../devices/occupancysensor').occupancysensor({
        id: node.id, name: 'Test occupancy', bat: false,
        sensorType: 0, sensorTypeBitmap: { pir: true, ultrasonic: false, physicalContact: false },
        occupied: null
    });
    await aggregator.add(node.device);
    node.emit('serverReady');

    node.receive({ payload: true });
    await settle();
    assert.equal(node.errors.length, 0);
    assert.equal(node.device.state.occupancySensing.occupancy.occupied, true);

    node.receive({ payload: false });
    await settle();
    assert.equal(node.errors.length, 0);
    assert.equal(node.device.state.occupancySensing.occupancy.occupied, false);
});

// The measurement sensors advertise their configured Min/Max Level to controllers;
// matter.js enforces that range, so in-range values are accepted and out-of-range
// values are rejected through Node-RED rather than crashing the bridge.
test('temperature sensor accepts in-range and rejects out-of-range readings', async t => {
    const aggregator = await createMatterBridge(t);
    const node = createNode('../temperaturesensor');
    // Configured range 0 .. 50 C (values are the Matter 0.01 C units the node sends).
    node.device = require('../devices/temperaturesensor').temperaturesensor({
        id: node.id, name: 'Test temperature', bat: false,
        minlevel: 0, maxlevel: 5000, measuredValue: null
    });
    await aggregator.add(node.device);
    node.emit('serverReady');

    node.receive({ payload: 12 });
    await settle();
    assert.equal(node.errors.length, 0, '12 C is within range and should be accepted');
    assert.equal(node.device.state.temperatureMeasurement.measuredValue, 1200);

    node.receive({ payload: -3 });
    await settle();
    assert.equal(node.errors.length, 1, '-3 C is below the configured min and should be rejected');
    assert.equal(node.device.state.temperatureMeasurement.measuredValue, 1200);
});
