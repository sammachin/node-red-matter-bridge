const  {Endpoint}  = require("@matter/main");
const  {BridgedDeviceBasicInformationServer, PowerSourceServer, OccupancySensingServer}  = require("@matter/main/behaviors");
const  {OccupancySensorDevice} = require("@matter/main/devices")
const  {PowerSource, OccupancySensing}  = require( "@matter/main/clusters")
const { batFeatures, batCluster } = require("../battery");

// Since OccupancySensing cluster revision 5 the enabled features must match the
// detector type, otherwise the cluster errors that "no features are enabled".
// Map the configured sensor bitmap to the corresponding cluster features.
function occupancyFeatures(bitmap) {
    const features = []
    if (bitmap && bitmap.pir) features.push(OccupancySensing.Feature.PassiveInfrared)
    if (bitmap && bitmap.ultrasonic) features.push(OccupancySensing.Feature.Ultrasonic)
    if (bitmap && bitmap.physicalContact) features.push(OccupancySensing.Feature.PhysicalContact)
    // Fall back to PIR so the cluster always has at least one feature enabled.
    return features.length ? features : [OccupancySensing.Feature.PassiveInfrared]
}

module.exports = {
    occupancysensor: function(child) {
        const device = new Endpoint(
            // OccupancySensorDevice does not include the OccupancySensing cluster by
            // default in this matter.js version, so add it explicitly; without it every
            // occupancy write throws "Behavior 'occupancySensing' is not present".
            OccupancySensorDevice.with(BridgedDeviceBasicInformationServer, OccupancySensingServer.with(... occupancyFeatures(child.sensorTypeBitmap)),  ... child.bat ? batCluster(child) : []), {
                id: child.id,
                bridgedDeviceBasicInformation: {
                    nodeLabel: child.name,
                    productName: child.name,
                    productLabel: child.name,
                    serialNumber: child.id.replace('-', ''),
                    uniqueId : child.id.replace('-', '').split("").reverse().join(""),
                    reachable: true,
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