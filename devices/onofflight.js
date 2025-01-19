const  {Endpoint}  = require("@matter/main");
const  {BridgedDeviceBasicInformationServer}  = require("@matter/main/behaviors");
const  {OnOffLightDevice}  = require("@matter/main/devices");
const { batFeatures, batCluster } = require("../battery");

module.exports = {
    onofflight: function(child) {
        const device = new Endpoint(
            OnOffLightDevice.with(BridgedDeviceBasicInformationServer, ... child.bat ? batCluster(child) : []), {
                id: child.id,
                bridgedDeviceBasicInformation: {
                    nodeLabel: child.name,
                    productName: child.name,
                    productLabel: child.name,
                    serialNumber: child.id,
                    reachable: true,
                },
                ... child.bat? {powerSource: batFeatures(child)}: {}
        });
        return device;
    }
 }