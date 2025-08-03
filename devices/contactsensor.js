const  {Endpoint}  = require("@matter/main")
const  {BridgedDeviceBasicInformationServer, PowerSourceServer}  = require("@matter/main/behaviors");
const  {ContactSensorDevice}  =  require( "@matter/main/devices")
const { batFeatures, batCluster } = require("../battery");

module.exports = {
    contactsensor: function(child, node) {
        const device = new Endpoint(
            ContactSensorDevice.with(
                BridgedDeviceBasicInformationServer, 
                ... child.bat ? batCluster(child) : []
            ),
            {
                id: child.id,
                bridgedDeviceBasicInformation: {
                    nodeLabel: child.name,
                    productName: child.name,
                    productLabel: child.name,
                    serialNumber: child.id.replace('-', ''),
                    uniqueId : child.id.replace('-', '').split("").reverse().join(""),
                    reachable: true,
                    vendorName : node.vendorName,
                    vendorId: VendorId(node.vendorId),
                    hardwareVersion: node.hardwareVersion,
                    softwareVersion: node.softwareVersion
                },
                booleanState: {
                    stateValue: child.stateValue ? child.stateValue : child.initial
                },
                ... child.bat? {powerSource: batFeatures(child)}: {}
            }
            )
            return device;
    }
 }