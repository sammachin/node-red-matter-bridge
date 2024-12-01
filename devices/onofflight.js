const  {Endpoint}  = require("@matter/main");
const  {BridgedDeviceBasicInformationServer}  = require("@matter/main/behaviors");
const  {OnOffLightDevice}  = require("@matter/main/devices");


module.exports = {
    onofflight: function(child) {
        const device = new Endpoint(
            OnOffLightDevice.with(BridgedDeviceBasicInformationServer),
            {
                id: child.id,
                bridgedDeviceBasicInformation: {
                    nodeLabel: child.name,
                    productName: child.name,
                    productLabel: child.name,
                    serialNumber: child.id,
                    reachable: true,
                },
        });
        return device;
    }
 }