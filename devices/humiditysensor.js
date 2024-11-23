const  {Endpoint}  = require("@matter/main");
const  {BridgedDeviceBasicInformationServer}  = require("@matter/main/behaviors");
const  {HumiditySensorDevice} = require("@matter/main/devices")

module.exports = {
    humiditysensor: function(child) {
        const device = new Endpoint(
            HumiditySensorDevice.with(BridgedDeviceBasicInformationServer),{
                id: child.id,
                bridgedDeviceBasicInformation: {
                    nodeLabel: child.name,
                    productName: child.name,
                    productLabel: child.name,
                    serialNumber: child.id,
                    reachable: true,
                },
                relativeHumidityMeasurement: {
                    minMeasuredValue: child.minlevel,
                    maxMeasuredValue: child.maxlevel,
                    measuredValue : child.measuredValue ? child.measuredValue : 0
                }
            }
            )
            device.events.identify.startIdentifying.on(() => {
                child.emit('identify', true)
            });
            device.events.identify.stopIdentifying.on(() => {
                child.emit('identify', false)
            });
            return device;
    }
 }