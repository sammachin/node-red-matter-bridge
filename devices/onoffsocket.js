const  {Endpoint}  = require("@matter/main")
const  {BridgedDeviceBasicInformationServer, PowerSourceServer}  = require("@matter/main/behaviors")
const  {OnOffPlugInUnitDevice}  = require("@matter/main/devices")
const  {PowerSource}  = require( "@matter/main/clusters")



module.exports = {
    onoffsocket: function(child) {
        const device = new Endpoint(
            OnOffPlugInUnitDevice.with(BridgedDeviceBasicInformationServer, ... child.bat? [PowerSourceServer.with(PowerSource.Feature.Battery, PowerSource.Feature.Rechargeable)]: []), {
                id: child.id,
                bridgedDeviceBasicInformation: {
                    nodeLabel: child.name,
                    productName: child.name,
                    productLabel: child.name,
                    serialNumber: child.id,
                    reachable: true,
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
        return device;
    }
 }