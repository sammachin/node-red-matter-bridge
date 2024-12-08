
const {Endpoint}  = require("@matter/main")
const {BridgedDeviceBasicInformationServer, PowerSourceServer}  = require("@matter/main/behaviors")
const {DoorLockDevice} = require("@matter/main/devices")
const  {PowerSource}  = require( "@matter/main/clusters")



module.exports = {
    doorlock: function(child) {
        const device = new Endpoint(DoorLockDevice.with(BridgedDeviceBasicInformationServer, ... child.bat? [PowerSourceServer.with(PowerSource.Feature.Battery, PowerSource.Feature.Rechargeable)]: []), {
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
                },
                ... child.bat? {powerSource: {
                    status: PowerSource.PowerSourceStatus.Active,
                    order: 1,
                    description: "Battery",
                    batFunctionalWhileCharging: true,
                    batChargeLevel: PowerSource.BatChargeLevel.Ok,
                    batChargeState: PowerSource.BatChargeState.Unknown,
                    batReplacementNeeded: false,
                    batReplaceability: PowerSource.BatReplaceability.Unspecified,
                }}: {}
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