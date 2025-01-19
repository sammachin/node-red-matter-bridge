const  { Endpoint }  = require("@matter/main");
const  { BridgedDeviceBasicInformationServer, PowerSourceServer}  = require("@matter/main/behaviors")
const  { ColorTemperatureLightDevice }  = require( "@matter/main/devices")
const  { ColorControlServer } = require( "@matter/main/behaviors")
const  { ColorControl }  = require( "@matter/main/clusters")
const  {PowerSource}  = require( "@matter/main/clusters")
const { batFeatures, batCluster } = require("../battery");

module.exports = {
    colortemplight: function(child) {
        const device = new Endpoint(
            ColorTemperatureLightDevice.with(BridgedDeviceBasicInformationServer, ColorControlServer.with(
                ColorControl.Feature.ColorTemperature,
            ), ... child.bat ? batCluster(child) : []
            ),
            {
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
                    colorMode: 2
                },
                ... child.bat? {powerSource: batFeatures(child)}: {}
            }
            )
            return device;
    }
 }