const  {Endpoint}  = require("@matter/main");
const  {BridgedDeviceBasicInformationServer}  = require("@matter/main/behaviors");
const  {HumiditySensorDevice} = require("@matter/main/devices")
const { batFeatures, batCluster } = require("../battery");


module.exports = {
    humiditysensor: function(child, node) {
        const device = new Endpoint(
            HumiditySensorDevice.with(BridgedDeviceBasicInformationServer, ... child.bat ? batCluster(child) : []), {
                id: child.id,
                bridgedDeviceBasicInformation: {
                    nodeLabel: child.name,
                    productName: child.name,
                    productLabel: child.name,
                    serialNumber: child.id.replace('-', ''),
                    uniqueId : child.id.replace('-', '').split("").reverse().join(""),
                    reachable: true,
                    vendorName : node.vendorName,
                    vendorId: node.vendorId,
                    hardwareVersion: node.hardwareVersion,
                    softwareVersion: node.softwareVersion
                },
                relativeHumidityMeasurement: {
                    minMeasuredValue: child.minlevel,
                    maxMeasuredValue: child.maxlevel,
                    measuredValue : child.measuredValue ? child.measuredValue : 0
                },
                ... child.bat? {powerSource: batFeatures(child)}: {}
            })
            return device;
    }
 }