const assert = require('node:assert/strict');
const test = require('node:test');
const { createMatterBridge } = require('./matter-helper');

const devices = [
    'onofflight', 'onoffsocket', 'dimmablelight', 'fullcolorlight', 'colortemplight',
    'contactsensor', 'lightsensor', 'temperaturesensor', 'occupancysensor',
    'pressuresensor', 'humiditysensor', 'genericswitch', 'windowcovering',
    'thermostat', 'doorlock', 'fan'
];

test('all device types initialize on the current Matter runtime', async t => {
    const aggregator = await createMatterBridge(t);
    for (const type of devices) {
        await t.test(type, async () => {
            const device = require(`../devices/${type}`)[type]({
                id: `test-${type}`, name: `Test ${type}`, bat: false,
                initial: false, minlevel: type === 'lightsensor' ? 1 : 0, maxlevel: 10000, measuredValue: 0,
                stateValue: false, occupied: false, sensorType: 0,
                sensorTypeBitmap: { pir: true, ultrasonic: false, physicalContact: false },
                switchtype: 'momentary', positions: 2, longPressDelay: 1000,
                multiPressDelay: 500, multiPressMax: 2, lift: 'pos', tilt: false,
                coveringType: 0, productType: 0, reversed: false,
                heat: true, cool: false, temperature: 2000, lockState: 1
            });
            await aggregator.add(device);
            assert.equal(aggregator.parts.get(device.id), device);
        });
    }
});
