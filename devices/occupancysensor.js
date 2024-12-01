const  {Endpoint}  = require("@matter/main");
const  {BridgedDeviceBasicInformationServer}  = require("@matter/main/behaviors");
const  {OccupancySensorDevice} = require("@matter/main/devices")

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
            return device;
    }
 }