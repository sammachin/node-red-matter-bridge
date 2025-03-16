const  {Endpoint}  = require("@matter/main");
const  {BridgedDeviceBasicInformationServer, IdentifyServer}  = require("@matter/main/behaviors");
const  {OnOffLightDevice}  = require("@matter/main/devices");
const { batFeatures, batCluster } = require("../battery");


//Dummy handler to see if any ecosystems use this command and to suppress warning abount implementtion
class NewIdentifyServer extends IdentifyServer {
    async triggerEffect(identifier, variant){
        console.log(`triggerEffect received identifier:${identifier}, variant: ${variant}`)
    }
}



module.exports = {
    onofflight: function(child) {
        const device = new Endpoint(
            OnOffLightDevice.with(BridgedDeviceBasicInformationServer, NewIdentifyServer, ... child.bat ? batCluster(child) : []), {
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