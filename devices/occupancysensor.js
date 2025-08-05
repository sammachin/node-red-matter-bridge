const  {Endpoint}  = require("@matter/main");
const  {BridgedDeviceBasicInformationServer, PowerSourceServer}  = require("@matter/main/behaviors");
const  {OccupancySensorDevice} = require("@matter/main/devices")
const  {PowerSource}  = require( "@matter/main/clusters")
const { batFeatures, batCluster } = require("../battery");

module.exports = {
    occupancysensor: function(child, node) {
        const device = new Endpoint(
            OccupancySensorDevice.with(BridgedDeviceBasicInformationServer,  ... child.bat ? batCluster(child) : []), {
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
                occupancySensing: {
                    occupancySensorType : child.sensorType,
                    occupancySensorTypeBitmap: child.sensorTypeBitmap,
                    occupancy: {occupied: child.occupied}
                },
                ... child.bat? {powerSource: batFeatures(child)}: {}
            });
            return device;
    }
 }