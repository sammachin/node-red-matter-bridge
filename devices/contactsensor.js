const  Endpoint  = require("@project-chip/matter.js/endpoint").Endpoint;
const  BridgedDeviceBasicInformationServer  = require("@project-chip/matter.js/behavior/definitions/bridged-device-basic-information").BridgedDeviceBasicInformationServer;
const  ContactSensorDevice  =  require( "@project-chip/matter.js/devices/ContactSensorDevice").ContactSensorDevice;
const  BooleanState  =  require( "@project-chip/matter.js/cluster").BooleanState; 

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
                    stateValue: child.initial
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