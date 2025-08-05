const  {Endpoint}  = require("@matter/main");
const  {BridgedDeviceBasicInformationServer, ThermostatServer}  = require("@matter/main/behaviors");
const {ThermostatDevice} = require("@matter/main/devices")
const {Thermostat} = require( "@matter/main/clusters")
const { batFeatures, batCluster } = require("../battery");

//Dummy handler to see if any ecosystems use this command and to suppress warning abount implementtion
class NewThermoStatServer extends ThermostatServer {
    async setpointRaiseLower(mode, amount){
        console.log(`setpointRaiseLower received mode:${mode}, amount: ${amount}`)
    }
}




module.exports = {
    thermostat: function(child, node) {
        let features = []
        if (child.heat) {
            features.push(Thermostat.Feature.Heating)
        }
        if (child.cool){
            features.push(Thermostat.Feature.Cooling)
        }
        let params = {
                systemMode: child.values ? child.values.systemMode : 0,
                localTemperature: child.temperature ? child.temperature : 0,
        }
        if (child.cool && !child.heat) {
            params.controlSequenceOfOperation = 0
        } else if (!child.cool && child.heat){
            params.controlSequenceOfOperation = 2
        } else if (child.cool && child.heat){
            params.controlSequenceOfOperation = 4
        } 
        child.heat ? params.minHeatSetpointLimit = 500 : null
        child.heat ? params.maxHeatSetpointLimit = 3500 : null
        child.heat ? params.absMinHeatSetpointLimit = 500 : null
        child.heat ? params.absMaxHeatSetpointLimit = 3500 : null
        child.cool ? params.minCoolSetpointLimit = 0 : null
        child.cool ? params.absMinCoolSetpointLimit = 0 : null
        child.cool ? params.maxCoolSetpointLimit = 2100 : null
        child.cool ? params.absMaxCoolSetpointLimit = 2100 : null
        if (params.systemMode == 4){
            params.occupiedHeatingSetpoint = child.values.occupiedHeatingSetpoint
        } else if (params.systemMode == 3){
            params.occupiedCoolingSetpoint = child.values.occupiedCoolingSetpoint
        } 
        const device = new Endpoint(ThermostatDevice.with(BridgedDeviceBasicInformationServer, NewThermoStatServer.with(
             ...features    
            ), ... child.bat ? batCluster(child) : []), {
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
                thermostat: {
                    ...params
                },
                ... child.bat? {powerSource: batFeatures(child)}: {}
            })
            return device;
    }
 }