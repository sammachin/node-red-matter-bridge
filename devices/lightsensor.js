const  {Endpoint}  = require("@matter/main");
const  {BridgedDeviceBasicInformationServer, PowerSourceServer}  = require("@matter/main/behaviors");
const  {LightSensorDevice} = require("@matter/main/devices")
const  {PowerSource}  = require( "@matter/main/clusters")

module.exports = {
    lightsensor: function(child) {
        const device = new Endpoint(
            LightSensorDevice.with(BridgedDeviceBasicInformationServer, ... child.bat? [PowerSourceServer.with(PowerSource.Feature.Battery, PowerSource.Feature.Rechargeable)]: []), {
                id: child.id,
                bridgedDeviceBasicInformation: {
                    nodeLabel: child.name,
                    productName: child.name,
                    productLabel: child.name,
                    serialNumber: child.id,
                    reachable: true,
                },
                illuminanceMeasurement: {
                    minMeasuredValue: Math.floor(10000*Math.log10(child.minlevel) +1),
                    maxMeasuredValue: Math.floor(10000*Math.log10(child.maxlevel) +1),
                    measuredValue : child.measuredValue ? child.measuredValue : 0
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

