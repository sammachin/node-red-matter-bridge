const  {Endpoint}  = require("@matter/main")
const  {BridgedDeviceBasicInformationServer}  = require("@matter/main/behaviors")
const  {OnOffPlugInUnitDevice}  = require("@matter/main/devices")



module.exports = {
    onoffsocket: function(child) {
        const device = new Endpoint(
            OnOffPlugInUnitDevice.with(BridgedDeviceBasicInformationServer),
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
        device.events.onOff.onOff$Changed.on(value => {
            child.emit('state', value)
        });
        device.events.identify.startIdentifying.on(() => {
            child.emit('identify', true)
        });
        device.events.identify.stopIdentifying.on(() => {
            child.emit('identify', false)
        });
            return device;
    }
 }