const {Endpoint}  = require("@matter/main");
const {BridgedDeviceBasicInformationServer}  = require("@matter/main/behaviors");
const {PressureSensorDevice} = require("@matter/main/devices")

module.exports = {
    pressuresensor: function(child) {
        const device = new Endpoint(
            PressureSensorDevice.with(BridgedDeviceBasicInformationServer),{
                id: child.id,
                bridgedDeviceBasicInformation: {
                    nodeLabel: child.name,
                    productName: child.name,
                    productLabel: child.name,
                    serialNumber: child.id,
                    reachable: true,
                },
                pressureMeasurement: {
                    minMeasuredValue: child.minlevel,
                    maxMeasuredValue: child.maxlevel,
                    measuredValue : child.measuredValue ? child.measuredValue : 0

                }
            })
            return device;
    }
 }