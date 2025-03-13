const {Endpoint}  = require("@matter/main");
const {BridgedDeviceBasicInformationServer}  = require("@matter/main/behaviors");
const {PressureSensorDevice} = require("@matter/main/devices")
const { batFeatures, batCluster } = require("../battery");

module.exports = {
    pressuresensor: function(child) {
        const device = new Endpoint(
            PressureSensorDevice.with(BridgedDeviceBasicInformationServer, ... child.bat ? batCluster(child) : []), {
                id: child.id,
                bridgedDeviceBasicInformation: {
                    nodeLabel: child.name,
                    productName: child.name,
                    productLabel: child.name,
                    serialNumber: child.id.replace('-', ''),
                    uniqueId : child.id.replace('-', '').split("").reverse().join(""),
                    reachable: true,
                },
                pressureMeasurement: {
                    minMeasuredValue: child.minlevel,
                    maxMeasuredValue: child.maxlevel,
                    measuredValue : child.measuredValue ? child.measuredValue : 0

                },
                ... child.bat? {powerSource: batFeatures(child)}: {}
            })
            return device;
    }
 }