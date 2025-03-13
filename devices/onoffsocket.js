const  {Endpoint}  = require("@matter/main")
const  {BridgedDeviceBasicInformationServer}  = require("@matter/main/behaviors")
const  {OnOffPlugInUnitDevice}  = require("@matter/main/devices")
const { batFeatures, batCluster } = require("../battery");



module.exports = {
    onoffsocket: function(child) {
        const device = new Endpoint(
            OnOffPlugInUnitDevice.with(BridgedDeviceBasicInformationServer, ... child.bat ? batCluster(child) : []
        ), {
                id: child.id,
                bridgedDeviceBasicInformation: {
                    nodeLabel: child.name,
                    productName: child.name,
                    productLabel: child.name,
                    serialNumber: child.id.replace('-', ''),
                    uniqueId : child.id.replace('-', '').split("").reverse().join(""),
                    reachable: true,
                },
                ... child.bat? {powerSource: batFeatures(child)}: {}
        });
        return device;
    }
 }