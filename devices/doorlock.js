
const {Endpoint}  = require("@matter/main")
const {BridgedDeviceBasicInformationServer, PowerSourceServer}  = require("@matter/main/behaviors")
const {DoorLockDevice} = require("@matter/main/devices")
const  {PowerSource}  = require( "@matter/main/clusters")
const { batFeatures, batCluster } = require("../battery");






module.exports = {
    doorlock: function(child) {
        const device = new Endpoint(DoorLockDevice.with(BridgedDeviceBasicInformationServer, 
            ... child.bat ? batCluster(child) : []
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
                doorLock: {
                    lockType: 2,
                    actuatorEnabled: true,
                    lockState: child.lockState ? child.lockState : 1
                },
                ... child.bat? {powerSource: batFeatures(child)}: {}
            })
            
            return device;
    }
 }