
const Endpoint  = require("@project-chip/matter.js/endpoint").Endpoint;
const BridgedDeviceBasicInformationServer  = require("@project-chip/matter.js/behavior/definitions/bridged-device-basic-information").BridgedDeviceBasicInformationServer;

const DoorLockDevice = require("@project-chip/matter.js/devices/DoorLockDevice").DoorLockDevice
//const DoorLock = require( "@project-chip/matter.js/cluster").DoorLock; 
//const DoorLockServer = require( "@project-chip/matter.js/behavior/definitions/door-lock").DoorLockServer





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