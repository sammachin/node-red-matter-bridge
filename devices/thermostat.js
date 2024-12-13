const  {Endpoint}  = require("@matter/main");
const  {BridgedDeviceBasicInformationServer, PowerSourceServer}  = require("@matter/main/behaviors");
const {ThermostatDevice} = require("@matter/main/devices")
const {Thermostat} = require( "@matter/main/clusters")
const {ThermostatServer} = require( "@matter/main/behaviors")
const  {PowerSource}  = require( "@matter/main/clusters")

module.exports = {
    thermostat: function(child) {
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
        const device = new Endpoint(ThermostatDevice.with(BridgedDeviceBasicInformationServer, ThermostatServer.with(
             ...features    
            ), ... child.bat? [PowerSourceServer.with(PowerSource.Feature.Battery, PowerSource.Feature.Rechargeable)]: []), {
                id: child.id,
                bridgedDeviceBasicInformation: {
                    nodeLabel: child.name,
                    productName: child.name,
                    productLabel: child.name,
                    serialNumber: child.id,
                    reachable: true,
                },
                thermostat: {
                    ...params
                },
                ... child.bat? {powerSource: {
                    status: PowerSource.PowerSourceStatus.Active,
                    order: 1,
                    description: "Battery",
                    batFunctionalWhileCharging: true,
                    batChargeLevel: PowerSource.BatChargeLevel.Ok,
                    batChargeState: PowerSource.BatChargeState.Unknown,
                    batReplacementNeeded: false,
                    batReplaceability: PowerSource.BatReplaceability.Unspecified,
                }}: {}
            })
            return device;
    }
 }