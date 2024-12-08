const  {Endpoint}  = require("@matter/main");
const  {BridgedDeviceBasicInformationServer, PowerSourceServer}  = require("@matter/main/behaviors");
const  {OccupancySensorDevice} = require("@matter/main/devices")
const  {PowerSource}  = require( "@matter/main/clusters")

module.exports = {
    occupancysensor: function(child) {
        const device = new Endpoint(
            OccupancySensorDevice.with(BridgedDeviceBasicInformationServer, ... child.bat? [PowerSourceServer.with(PowerSource.Feature.Battery, PowerSource.Feature.Rechargeable)]: []), {
                id: child.id,
                bridgedDeviceBasicInformation: {
                    nodeLabel: child.name,
                    productName: child.name,
                    productLabel: child.name,
                    serialNumber: child.id,
                    reachable: true,
                },
                occupancySensing: {
                    occupancySensorType : child.sensorType,
                    occupancySensorTypeBitmap: child.sensorTypeBitmap,
                    occupancy: {occupied: child.occupied}
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