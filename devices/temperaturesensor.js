const  {Endpoint}  = require("@matter/main");
const  {BridgedDeviceBasicInformationServer}  = require("@matter/main/behaviors");
const  {TemperatureSensorDevice} = require("@matter/main/devices")
const { batFeatures, batCluster } = require("../battery");

module.exports = {
    temperaturesensor: function(child) {
        const device = new Endpoint(
            TemperatureSensorDevice.with(BridgedDeviceBasicInformationServer, ... child.bat ? batCluster(child) : []), {
                id: child.id,
                bridgedDeviceBasicInformation: {
                    nodeLabel: child.name,
                    productName: child.name,
                    productLabel: child.name,
                    serialNumber: child.id.replace('-', ''),
                    uniqueId : child.id.replace('-', '').split("").reverse().join(""),
                    reachable: true,
                },
                temperatureMeasurement: {
                    minMeasuredValue: child.minlevel,
                    maxMeasuredValue: child.maxlevel,
                    measuredValue : child.measuredValue ? child.measuredValue : 0

                },
                ... child.bat? {powerSource: batFeatures(child)}: {}
            })
        return device;
    }
 }