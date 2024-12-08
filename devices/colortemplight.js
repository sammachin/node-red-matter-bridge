const  { Endpoint }  = require("@matter/main");
const  { logEndpoint, ColorTemperatureLightDevice }  = require( "@matter/main/devices")
const  { BridgedDeviceBasicInformationServer,  ColorControlServer, PowerSourceServer } = require( "@matter/main/behaviors")
const  { ColorControl, PowerSource }  = require( "@matter/main/clusters")


module.exports = {
    colortemplight: function(child) {
        const device = new Endpoint(
            ColorTemperatureLightDevice.with(BridgedDeviceBasicInformationServer, ColorControlServer.with(
                ColorControl.Feature.ColorTemperature,
            ), ... child.bat? [PowerSourceServer.with(PowerSource.Feature.Battery, PowerSource.Feature.Rechargeable)]: []), {
                id: child.id,
                bridgedDeviceBasicInformation: {
                    nodeLabel: child.name,
                    productName: child.name,
                    productLabel: child.name,
                    serialNumber: child.id,
                    reachable: true,
                },
                colorControl: {
                    coupleColorTempToLevelMinMireds: 0x00FA,
                    startUpColorTemperatureMireds: 0x00FA,
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
            device.events.onOff.onOff$Changed.on(value => {
                child.emit('state', value)
            });
            device.events.levelControl.currentLevel$Changed.on(value => {
                let data = {level: value}
                child.emit('state', data)
            })
            device.events.identify.startIdentifying.on(() => {
                child.emit('identify', true)
            });
            device.events.identify.stopIdentifying.on(() => {
                child.emit('identify', false)
            });
            device.events.colorControl.colorTemperatureMireds$Changed.on(value => {
                let data = {temp: value}
                child.emit('state', data)
            });
            return device;
    }
 }