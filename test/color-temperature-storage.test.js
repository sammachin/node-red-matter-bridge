const assert = require('node:assert/strict');
const test = require('node:test');
const { createMatterBridge } = require('./matter-helper');

for (const type of ['fullcolorlight', 'colortemplight']) {
    test(`${type} restores a cool-white temperature and accepts later changes`, async t => {
        // A controller previously selected 5000 K (200 mireds), then Node-RED restarted.
        const aggregator = await createMatterBridge(t, {
            'root.parts.aggregator.parts.stored-light.colorControl': {
                colorTemperatureMireds: 200, colorMode: 2, enhancedColorMode: 2
            }
        });
        const device = require(`../devices/${type}`)[type]({
            id: 'stored-light', name: 'Stored light', bat: false
        });
        await aggregator.add(device);
        assert.equal(device.state.colorControl.colorTemperatureMireds, 200);
        for (const temperature of [153, 250, 500]) {
            await device.set({ colorControl: { colorTemperatureMireds: temperature } });
            assert.equal(device.state.colorControl.colorTemperatureMireds, temperature);
        }
    });
}
