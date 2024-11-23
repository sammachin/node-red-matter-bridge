const  {Endpoint}  = require("@matter/main")
const  {BridgedDeviceBasicInformationServer}  = require("@matter/main/behaviors");
const  {ContactSensorDevice}  =  require( "@matter/main/devices")

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