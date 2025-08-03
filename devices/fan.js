const  {Endpoint}  = require("@matter/main");
const  {BridgedDeviceBasicInformationServer, FanControlServer}  = require("@matter/main/behaviors");
const  {FanDevice}  = require("@matter/main/devices");
const  {FanControl}  = require( "@matter/main/clusters")
const { batFeatures, batCluster } = require("../battery");


module.exports = {
    fan: function(child, node) {
        features = [
            FanControl.Feature.MultiSpeed,
            FanControl.Feature.Auto,
            FanControl.Feature.Rocking,
            FanControl.Feature.AirflowDirection
        ]

        const device = new Endpoint(
            FanDevice.with(BridgedDeviceBasicInformationServer, FanControlServer.with(...features), ... child.bat ? batCluster(child) : []), {
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
                fanControl :{
                    fanMode: 0,
                    fanModeSequence: 2,
                    percentCurrent: 0,
                    speedMax: 100,
                    speedSetting: 0,
                    speedCurrent: 0,
                    rockSupport: { rockLeftRight: true, rockUpDown: false, rockRound: false },
                    rockSetting: FanControl.Rock.rockLeftRight,
                    airflowDirection: 0
                },
                ... child.bat? {powerSource: batFeatures(child)}: {}
        });
        return device;
    }
 }