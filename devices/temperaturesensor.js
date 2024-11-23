const temperaturesensor = require("../temperaturesensor");

const  Endpoint  = require("@project-chip/matter.js/endpoint").Endpoint;
const  BridgedDeviceBasicInformationServer  = require("@project-chip/matter.js/behavior/definitions/bridged-device-basic-information").BridgedDeviceBasicInformationServer;
const  TemperatureSensorDevice = require("@project-chip/matter.js/devices/TemperatureSensorDevice").TemperatureSensorDevice
const  PowerSourceServer = require("@project-chip/matter.js/behavior/definitions/power-source").PowerSourceServer


module.exports = {
    temperaturesensor: function(child) {
        let clusters = [BridgedDeviceBasicInformationServer]
        if (child.battery) {
            clusters.push(PowerSourceServer)
        }
        const device = new Endpoint(
            TemperatureSensorDevice.with(clusters),{
                id: child.id,
                bridgedDeviceBasicInformation: {
                    nodeLabel: child.name,
                    productName: child.name,
                    productLabel: child.name,
                    serialNumber: child.id,
                    reachable: true,
                },
                temperatureMeasurement: {
                    minMeasuredValue: child.minlevel,
                    maxMeasuredValue: child.maxlevel,
                    measuredValue : child.measuredValue ? child.measuredValue : 0
                },
                powerSource : {
                    status : 1,
                    order: 1,
                    description: "Battery"
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