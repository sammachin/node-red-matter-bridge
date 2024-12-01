const  {Endpoint}  = require("@matter/main");
const  {BridgedDeviceBasicInformationServer}  = require("@matter/main/behaviors");
const  {DimmableLightDevice}   = require("@matter/main/devices")


module.exports = {
    dimmablelight: function(child) {
        const device = new Endpoint(
            DimmableLightDevice.with(BridgedDeviceBasicInformationServer),
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