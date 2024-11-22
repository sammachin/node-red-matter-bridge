const  Endpoint  = require("@matter/main/endpoint").Endpoint;
const  BridgedDeviceBasicInformationServer  = require("@matter/main/behavior/definitions/bridged-device-basic-information").BridgedDeviceBasicInformationServer;
const  OnOffPlugInUnitDevice = require( "@matter/main/devices/OnOffPlugInUnitDevice").OnOffPlugInUnitDevice;


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