const assert = require('node:assert/strict');
const test = require('node:test');
const { createMatterBridge } = require('./matter-helper');

for (const [type, expectedType] of [['fullcolorlight', 0x010d], ['colortemplight', 0x010c]]) {
    test(`${type} advertises the correct Matter light type`, async t => {
        const aggregator = await createMatterBridge(t);
        const device = require(`../devices/${type}`)[type]({
            id: 'existing-light', name: 'Existing light', bat: false
        });
        await aggregator.add(device);
        const types = device.state.descriptor.deviceTypeList.map(entry => entry.deviceType);
        assert.ok(types.includes(expectedType), `Expected device type 0x${expectedType.toString(16)}, got ${types}`);
        assert.ok(types.includes(0x0013), 'Must remain a bridged device');
        assert.equal(device.id, 'existing-light');
        const capabilities = device.state.colorControl.colorCapabilities;
        assert.equal(capabilities.colorTemperature, true);
        if (type === 'fullcolorlight') {
            assert.equal(types.includes(0x010c), false, 'Must not advertise a temperature-only light');
            assert.equal(capabilities.hueSaturation, true);
            assert.equal(capabilities.xy, true);
        }
    });
}
