const  {Endpoint}  = require("@matter/main");
const  {BridgedDeviceBasicInformationServer, PowerSourceServer,  SwitchServer}  = require("@matter/main/behaviors");
const  {GenericSwitchDevice} = require("@matter/main/devices")
const  {Switch, PowerSource} = require( "@matter/main/clusters") 


module.exports = {
    genericswitch: function(child) {
        let features = [
            child.switchtype == 'momentary' ? Switch.Feature.MomentarySwitch : Switch.Feature.LatchingSwitch,
            child.switchtype == 'momentary' ? Switch.Feature.MomentarySwitchLongPress : null, 
            child.switchtype == 'momentary' ? Switch.Feature.MomentarySwitchRelease : null, 
            child.switchtype == 'momentary' ? Switch.Feature.MomentarySwitchMultiPress : null
        ]
        features = features.filter(Boolean)
        const device = new Endpoint(
            GenericSwitchDevice.with(BridgedDeviceBasicInformationServer, SwitchServer.with(
                ...features
            ), ... child.bat? [PowerSourceServer.with(PowerSource.Feature.Battery, PowerSource.Feature.Rechargeable)]: []), {
                id: child.id,
                bridgedDeviceBasicInformation: {
                    nodeLabel: child.name,
                    productName: child.name,
                    productLabel: child.name,
                    serialNumber: child.id,
                    reachable: true,
                },
                switch: child.switchtype == 'momentary' ? { longPressDelay: child.longPressDelay, multiPressDelay: child.multiPressDelay, multiPressMax: child.multiPressMax, numberOfPositions: child.positions }: {numberOfPositions: child.positions},
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
            return device;
    }
 }