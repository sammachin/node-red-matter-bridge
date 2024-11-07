
const Endpoint  = require("@project-chip/matter.js/endpoint").Endpoint;
const BridgedDeviceBasicInformationServer  = require("@project-chip/matter.js/behavior/definitions/bridged-device-basic-information").BridgedDeviceBasicInformationServer;

const ThermostatDevice = require("@project-chip/matter.js/devices/ThermostatDevice").ThermostatDevice
const Thermostat = require( "@project-chip/matter.js/cluster").Thermostat; 
const ThermostatServer = require( "@project-chip/matter.js/behavior/definitions/thermostat").ThermostatServer





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
        console.log(params)
        const device = new Endpoint(ThermostatDevice.with(BridgedDeviceBasicInformationServer, ThermostatServer.with(
             ...features    
            )),{
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
                }
            })

            device.events.identify.startIdentifying.on(() => {
                child.emit('identify', true)
            });
            device.events.identify.stopIdentifying.on(() => {
                child.emit('identify', false)
            });

            
            device.events.thermostat.systemMode$Changed.on((value) => {
                child.values ? child.values.systemMode=value : child.values={systemMode:value}
                child.emit('mode', value)
                
            });

            device.events.thermostat.localTemperature$Changed.on((value) => {
                child.emit('temp', value)
            });

            if (child.heat){
                device.events.thermostat.occupiedHeatingSetpoint$Changed.on((value) => {
                    child.values ? child.values.occupiedHeatingSetpoint=value : child.values={occupiedHeatingSetpoint:value}
                    child.emit('setpoint', 'heat', value)})
            }
            if (child.cool){
                device.events.thermostat.occupiedCoolingSetpoint$Changed.on((value) => {
                    child.values ? child.values.occupiedCoolingSetpoint=value : child.values={occupiedCoolingSetpoint:value}
                    child.emit('setpoint', 'cool', value)})
            }

            return device;
    }
 }