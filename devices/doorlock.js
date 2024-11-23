
const {Endpoint}  = require("@matter/main")
const {BridgedDeviceBasicInformationServer}  = require("@matter/main/behaviors")
const {DoorLockDevice} = require("@matter/main/devices")






module.exports = {
    doorlock: function(child) {
        const device = new Endpoint(DoorLockDevice.with(BridgedDeviceBasicInformationServer),{
                id: child.id,
                bridgedDeviceBasicInformation: {
                    nodeLabel: child.name,
                    productName: child.name,
                    productLabel: child.name,
                    serialNumber: child.id,
                    reachable: true,
                },
                doorLock: {
                    lockType: 2,
                    actuatorEnabled: true,
                    lockState: child.lockState ? child.lockState : 1
                }
            })

            device.events.identify.startIdentifying.on(() => {
                child.emit('identify', true)
            });
            device.events.identify.stopIdentifying.on(() => {
                child.emit('identify', false)
            });

            device.events.doorLock.lockState$Changed.on((value) => {
                let states = {0 :'unlocked', 1 : 'locked', 2 : 'unlocked'}
                child.lockState = value
                child.emit('state', states[value])
            });


            return device;
    }
 }