const  { Endpoint }  = require("@matter/main");
const  { BridgedDeviceBasicInformationServer}  = require("@matter/main/behaviors")
const  { ColorTemperatureLightDevice }  = require( "@matter/main/devices")
const  { ColorControlServer } = require( "@matter/main/behaviors")
const  { ColorControl }  = require( "@matter/main/clusters")
const { batFeatures, batCluster } = require("../battery");


module.exports = {
    fullcolorlight: function(child) {
        const device = new Endpoint(
            ColorTemperatureLightDevice.with(BridgedDeviceBasicInformationServer, ColorControlServer.with(
                ColorControl.Feature.HueSaturation,
                ColorControl.Feature.Xy,
                ColorControl.Feature.ColorTemperature,
            ), ... child.bat ? batCluster(child) : []), {
                id: child.id,
                bridgedDeviceBasicInformation: {
                    nodeLabel: child.name,
                    productName: child.name,
                    productLabel: child.name,
                    serialNumber: child.id.replace('-', ''),
                    uniqueId : child.id.replace('-', '').split("").reverse().join(""),
                    reachable: true,
                },
                colorControl: {
                    coupleColorTempToLevelMinMireds: 0x00FA,
                    startUpColorTemperatureMireds: 0x00FA,
                    colorMode: 0
                },
                ... child.bat? {powerSource: batFeatures(child)}: {}
            })
            return device;
    }
 }