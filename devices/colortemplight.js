const  { Endpoint }  = require("@matter/main");
const  { BridgedDeviceBasicInformationServer, PowerSourceServer, IdentifyServer}  = require("@matter/main/behaviors")
const  { ColorTemperatureLightDevice }  = require( "@matter/main/devices")
const  { ColorControlServer } = require( "@matter/main/behaviors")
const  { ColorControl }  = require( "@matter/main/clusters")
const  {PowerSource}  = require( "@matter/main/clusters")
const { batFeatures, batCluster } = require("../battery");



//Dummy handler to see if any ecosystems use this command and to suppress warning abount implementtion
class NewIdentifyServer extends IdentifyServer {
    async triggerEffect(identifier, variant){
        console.log(`triggerEffect received identifier:${identifier}, variant: ${variant}`)
    }
}

 
module.exports = {
    colortemplight: function(child, node) {
        const device = new Endpoint(
            ColorTemperatureLightDevice.with(BridgedDeviceBasicInformationServer, NewIdentifyServer, ColorControlServer.with(
                ColorControl.Feature.ColorTemperature,
            ), ... child.bat ? batCluster(child) : []
            ),
            {
                id: child.id,
                bridgedDeviceBasicInformation: {
                    nodeLabel: child.name,
                    productName: child.name,
                    productLabel: child.name,
                    serialNumber: child.id.replace('-', ''),
                    uniqueId : child.id.replace('-', '').split("").reverse().join(""),
                    reachable: true,
                    vendorName : node.vendorName,
                    vendorId: VendorId(node.vendorId),
                    hardwareVersion: node.hardwareVersion,
                    softwareVersion: node.softwareVersion
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