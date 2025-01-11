const  {Endpoint}  = require("@matter/main");
const  {BridgedDeviceBasicInformationServer, PowerSourceServer, FanControlServer}  = require("@matter/main/behaviors");
const  {FanDevice}  = require("@matter/main/devices");
const  {FanControl}  = require( "@matter/main/clusters")


module.exports = {
    fan: function(child) {
        features = [
            FanControl.Feature.MultiSpeed,
            FanControl.Feature.Auto,
            FanControl.Feature.Rocking,
            FanControl.Feature.AirflowDirection
        ]

        const device = new Endpoint(
            FanDevice.with(BridgedDeviceBasicInformationServer, FanControlServer.with(...features), ... child.bat? [PowerSourceServer.with(PowerSource.Feature.Battery, PowerSource.Feature.Rechargeable)]: []), {
                id: child.id,
                bridgedDeviceBasicInformation: {
                    nodeLabel: child.name,
                    productName: child.name,
                    productLabel: child.name,
                    serialNumber: child.id,
                    reachable: true,
                },
                fanControl :{
                    fanMode: 0,
                    fanModeSequence: 2,
                    percentCurrent: 0,
                    speedMax: 100,
                    speedSetting: 0,
                    speedCurrent: 0,
                    rockSupport: { rockLeftRight: true, rockUpDown: false, rockRound: false },
                    rockSetting: FanControl.Rock.rockLeftRight,
                    airflowDirection: 0
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