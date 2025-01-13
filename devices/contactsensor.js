const  {Endpoint}  = require("@matter/main")
const  {BridgedDeviceBasicInformationServer, PowerSourceServer}  = require("@matter/main/behaviors");
const  {ContactSensorDevice}  =  require( "@matter/main/devices")
const  {PowerSource}  = require( "@matter/main/clusters");
const { batFeatures } = require("../battery");

module.exports = {
    contactsensor: function(child) {
        console.log(`BAT: ${child.bat}`)
        const device = new Endpoint(
            ContactSensorDevice.with(
                BridgedDeviceBasicInformationServer, 
                ... child.bat? 
                    [
                        PowerSourceServer.with(
                        PowerSource.Feature.Battery, 
                        (child.bat=='recharge') ? PowerSource.Feature.Rechargeable : PowerSource.Feature.Replaceable
                    )]
                    : []
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
                booleanState: {
                    stateValue: child.stateValue ? child.stateValue : child.initial
                },
                ... child.bat? {powerSource: batFeatures(child)}: {}
            }
            )
            return device;
    }
 }