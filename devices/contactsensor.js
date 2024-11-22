const  Endpoint  = require("@matter/main/endpoint").Endpoint;
const  BridgedDeviceBasicInformationServer  = require("@matter/main/behavior/definitions/bridged-device-basic-information").BridgedDeviceBasicInformationServer;
const  ContactSensorDevice  =  require( "@matter/main/devices/ContactSensorDevice").ContactSensorDevice;
const  BooleanState  =  require( "@matter/main/cluster").BooleanState; 

module.exports = {
    contactsensor: function(child) {
        const device = new Endpoint(
            ContactSensorDevice.with(BridgedDeviceBasicInformationServer),{
                id: child.id,
                bridgedDeviceBasicInformation: {
                    nodeLabel: child.name,
                    productName: child.name,
                    productLabel: child.name,
                    serialNumber: child.id,
                    reachable: true,
                },
                booleanState: {
                    stateValue: child.stateValue ? child.stateValue : child.initial
                }
            }
            )
            device.events.identify.startIdentifying.on(() => {
                child.emit('identify', true)
            });
            device.events.identify.stopIdentifying.on(() => {
                child.emit('identify', false)
            });
            return device;
    }
 }