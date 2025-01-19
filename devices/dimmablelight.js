const  {Endpoint}  = require("@matter/main");
const  {BridgedDeviceBasicInformationServer, PowerSourceServer}  = require("@matter/main/behaviors");
const  {DimmableLightDevice}   = require("@matter/main/devices")
const  {PowerSource}  = require( "@matter/main/clusters")
const { batFeatures, batCluster } = require("../battery");


module.exports = {
    dimmablelight: function(child) {
        const device = new Endpoint(
            DimmableLightDevice.with(BridgedDeviceBasicInformationServer, ... child.bat ? batCluster(child) : []
            ), 
            {
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