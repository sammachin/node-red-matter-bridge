
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
            
            return device;
    }
 }