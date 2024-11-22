const temperaturesensor = require("../temperaturesensor");

const  Endpoint  = require("@matter/main/endpoint").Endpoint;
const  BridgedDeviceBasicInformationServer  = require("@matter/main/behavior/definitions/bridged-device-basic-information").BridgedDeviceBasicInformationServer;
const  OccupancySensorDevice = require("@matter/main/devices/OccupancySensorDevice").OccupancySensorDevice

module.exports = {
    occupancysensor: function(child) {
        const device = new Endpoint(
            OccupancySensorDevice.with(BridgedDeviceBasicInformationServer),{
                id: child.id,
                bridgedDeviceBasicInformation: {
                    nodeLabel: child.name,
                    productName: child.name,
                    productLabel: child.name,
                    serialNumber: child.id,
                    reachable: true,
                },
                occupancySensing: {
                    occupancySensorType : child.sensorType,
                    occupancySensorTypeBitmap: child.sensorTypeBitmap,
                    occupancy: {occupied: child.occupied}
                }
            });

            device.events.identify.startIdentifying.on(() => {
                child.emit('identify', true)
            });
            device.events.identify.stopIdentifying.on(() => {
                child.emit('identify', false)
            });
            return device;
    }
 }