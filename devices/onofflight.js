const  {Endpoint}  = require("@matter/main");
const  {BridgedDeviceBasicInformationServer, PowerSourceServer}  = require("@matter/main/behaviors");
const  {OnOffLightDevice}  = require("@matter/main/devices");
const  {PowerSource}  = require( "@matter/main/clusters")


module.exports = {
    onofflight: function(child) {
        const device = new Endpoint(
            OnOffLightDevice.with(BridgedDeviceBasicInformationServer, ... child.bat? [PowerSourceServer.with(PowerSource.Feature.Battery, PowerSource.Feature.Rechargeable)]: []), {
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
        device.events.onOff.onOff$Changed.on(value => {
            child.emit('state', value)
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