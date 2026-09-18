const assert = require('node:assert/strict');
const test = require('node:test');
const { createNode, observable, settle } = require('./helpers');
const { createMatterBridge } = require('./matter-helper');
const { thermostat } = require('../devices/thermostat');

function device() {
    return {
        state: { thermostat: { systemMode: 4, localTemperature: 1800, occupiedHeatingSetpoint: 2100 } },
        events: {
            identify: { startIdentifying: observable(), stopIdentifying: observable() },
            thermostat: Object.fromEntries(['systemMode', 'localTemperature', 'occupiedHeatingSetpoint'].map(key => [key + '$Changed', observable()]))
        },
        updates: [],
        async set(data) {
            this.updates.push(structuredClone(data));
            Object.assign(this.state.thermostat, data.thermostat);
        }
    };
}

function node() { return createNode('../thermostat', { mode: 'heat' }); }

test('thermostat queues and clones input until its Matter device is ready', async () => {
    const thermostatNode = node();
    const message = { payload: { temperature: 19 } };
    thermostatNode.receive(message);
    message.payload.temperature = 99;
    await settle();
    thermostatNode.device = device();
    assert.equal(thermostatNode.device.updates.length, 0);
    thermostatNode.emit('serverReady');
    await settle();
    assert.equal(thermostatNode.errors.length, 0);
    assert.equal(thermostatNode.device.state.thermostat.localTemperature, 1900);
    assert.equal(thermostatNode.device.updates.length, 1);
});

test('thermostat replays different retained attributes in order', async () => {
    const thermostatNode = node();
    thermostatNode.receive({ payload: { temperature: 19 } });
    thermostatNode.receive({ payload: { setPoint: 23 } });
    thermostatNode.device = device();
    thermostatNode.emit('serverReady');
    await settle();
    assert.equal(thermostatNode.device.state.thermostat.localTemperature, 1900);
    assert.equal(thermostatNode.device.state.thermostat.occupiedHeatingSetpoint, 2300);
});

test('thermostat bounds its startup input queue', async () => {
    const thermostatNode = node();
    for (let value = 0; value < 101; value++) {
        thermostatNode.receive({ payload: { temperature: 2000 + value } });
    }
    thermostatNode.device = device();
    thermostatNode.emit('serverReady');
    await settle();
    assert.equal(thermostatNode.warnings.length, 1);
    assert.equal(thermostatNode.device.updates.length, 100);
    assert.equal(thermostatNode.device.updates[0].thermostat.localTemperature, 2001);
});

test('thermostat reports rejected input processing through Node-RED', async () => {
    const thermostatNode = node();
    thermostatNode.device = device();
    thermostatNode.emit('serverReady');
    const message = { payload: {} };
    Object.defineProperty(message.payload, 'mode', { get() { throw new Error('invalid mode'); } });
    thermostatNode.receive(message);
    await settle();
    assert.equal(thermostatNode.errors.length, 1);
    assert.equal(thermostatNode.errors[0].error.message, 'invalid mode');
    assert.equal(thermostatNode.errors[0].msg, message);
});

test('queued thermostat input works with an actual offline Matter device', async t => {
    const aggregator = await createMatterBridge(t);
    const thermostatNode = node();
    thermostatNode.receive({ payload: { temperature: 19, setPoint: 22, mode: 'heat' } });
    thermostatNode.device = thermostat(thermostatNode);
    await aggregator.add(thermostatNode.device);
    thermostatNode.emit('serverReady');
    await settle();
    assert.equal(thermostatNode.errors.length, 0);
    assert.equal(thermostatNode.device.state.thermostat.localTemperature, 1900);
    assert.equal(thermostatNode.device.state.thermostat.occupiedHeatingSetpoint, 2200);
});
