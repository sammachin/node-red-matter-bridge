const {logEndpoint, EndpointServer} = require( "@matter/main")

const { hasProperty, isNumber, willUpdate } = require('./utils');

module.exports = function(RED) {
    function MatterThermostat(config) {
        RED.nodes.createNode(this,config);
        var node = this;
        node.bridge = RED.nodes.getNode(config.bridge);
        node.name = config.name
        node.mode = config.mode
        node.heat = (config.mode == 'heat' || config.mode == 'heatcool')
        node.cool = (config.mode == 'cool' || config.mode == 'heatcool')
        node.ctx =  this.context().global;
        node.values = node.ctx.get(node.id+"-values") || null
        node.temperature = node.ctx.get(node.id+"-temperature") || null
        this.log(`Loading Device node ${node.id}`)
        node.status({fill:"red",shape:"ring",text:"not running"});
        node.pending = false
        node.passthrough = /^true$/i.test(config.passthrough)
        node.bat = config.bat;
        node.identifying = false
        node.identifyEvt = function() {
            node.identifying = !node.identifying
            if (node.identifying){
                node.status({fill:"blue",shape:"dot",text:"identify"});
            } else {
                node.status({fill:"green",shape:"dot",text:"ready"});
            }
        };
        
        node.modeEvt = function(value){
            node.values ? node.values.systemMode=value : node.values={systemMode:value}
            let modes = {0 : 'off', 3 : 'cool', 4 : 'heat'}
            let temp = node.device.state.thermostat.localTemperature
            data = {'mode' : modes[value], temperature : temp}
            if (value == 4){
                data.setPoint = node.device.state.thermostat.occupiedHeatingSetpoint
            } else if (value == 3){
                data.setPoint = node.device.state.thermostat.occupiedCoolingSetpoint
            }
            if ((node.pending && node.passthrough)) {
                var msg = node.pendingmsg
                msg.payload = data
                node.send(msg);
            } else if (!node.pending){
                var msg = {payload : {}};
                msg.payload=data
                node.send(msg);
            }
            node.pending = false
        };
        
        node.coolSetpointEvt =  function(value){
            let temp = node.device.state.thermostat.localTemperature
            node.values ? node.values.occupiedCoolingSetpoint=value : node.values={occupiedCoolingSetpoint:value}
            data = {mode : 'cool', setPoint : value, temperature: temp}
            if ((node.pending && node.passthrough)) {
                var msg = node.pendingmsg
                msg.payload = data
                node.send(msg);
            } else if (!node.pending){
                var msg = {payload : {}};
                msg.payload=data
                node.send(msg);
            }
            node.pending = false
        };
        
        node.heatSetpointEvt =  function(value){
            node.values ? node.values.occupiedHeatingSetpoint=value : node.values={occupiedHeatingSetpoint:value}
            let temp = node.device.state.thermostat.localTemperature
            data = {mode : 'heat', setPoint : value, temperature: temp}
            if ((node.pending && node.passthrough)) {
                var msg = node.pendingmsg
                msg.payload = data
                node.send(msg);
            } else if (!node.pending){
                var msg = {payload : {}};
                msg.payload=data
                node.send(msg);
            }
            node.pending = false
        };

        node.tempEvt =  function(value){
            let modes = {0 : 'off', 3 : 'cool', 4 : 'heat'}
            let mode = node.device.state.thermostat.systemMode
            data = {'mode' : modes[mode], 'temperature' : value}
            if (mode == 4){
                data.setPoint = node.device.state.thermostat.occupiedHeatingSetpoint
            } else if (mode == 3){
                data.setPoint = node.device.state.thermostat.occupiedCoolingSetpoint
            }
            if ((node.pending && node.passthrough)) {
                var msg = node.pendingmsg
                msg.payload = data
                node.send(msg);
            }
            node.pending = false
        };

        this.on('input', function(msg) {
            switch (msg.topic) {
                case 'state':
                     if (hasProperty(msg, 'payload')) {
                         node.device.set(msg.payload)
                     }
                     if (config.wires.length != 0){
                         msg.payload = node.device.state
                         node.send(msg)
                     } else{
                         node.error((node.device.state));
                     }
                     break;
                 case 'battery':
                     if (node.bat){
                         node.device.set({
                             powerSource: {
                                 batChargeLevel: msg.battery.batChargeLevel
                             }
                         })
                     }
                     break
                default:
                    if (!hasProperty(msg.payload, 'mode') || !hasProperty(msg.payload, 'setPoint') || !hasProperty(msg.payload, 'temperature')){
                        node.error('Invalid input')
                        break;
                    }
                    var newData = {thermostat : {}}
                    sysMode(msg, newData)
                    .then((systemMode) => setPoint(msg, newData, systemMode))
                    .then(() => temperature(msg, newData))
                    .then(() => {
                        //If values are changed then set them & wait for callback otherwise send msg on
                        if (willUpdate.call(node.device, newData)) {
                            this.debug('WILL UPDATE')
                            node.pending = true
                            node.pendingmsg = msg
                            node.device.set(newData).catch((err) => {node.debug(err); node.error('Invalid Input')})
                        } else {
                            this.debug('WONT UPDATE')
                            if (node.passthrough){
                                node.send(msg);
                            }
                        }
                    })
                    break
            }
        });

        this.on('serverReady', function() {
            var node = this
            node.device.events.identify.startIdentifying.on(node.identifyEvt)
            node.device.events.identify.stopIdentifying.on(node.identifyEvt)
            node.device.events.thermostat.systemMode$Changed.on(node.modeEvt)
            node.device.events.thermostat.localTemperature$Changed.on(node.tempEvt)
            if (node.heat){
                node.device.events.thermostat.occupiedHeatingSetpoint$Changed.on(node.heatSetpointEvt)
            }
            if (node.cool){
                node.device.events.thermostat.occupiedCoolingSetpoint$Changed.on(node.coolSetpointEvt)
            }
            node.status({fill:"green",shape:"dot",text:"ready"});    
        })

        this.on('close', async function(removed, done) {
            let node = this
            let rtype = removed ? 'Device was removed/disabled' : 'Device was restarted'
            node.log(`Closing device: ${this.id}, ${rtype}`)
            //Remove Matter.js Events
            await node.device.events.identify.startIdentifying.off(node.identifyEvt)
            await node.device.events.identify.stopIdentifying.off(node.identifyEvt)
            await node.device.events.thermostat.systemMode$Changed.off(node.modeEvt)
            await node.device.events.thermostat.localTemperature$Changed.off(node.tempEvt)
            if (node.heat){
                await node.device.events.thermostat.occupiedHeatingSetpoint$Changed.off(node.heatSetpointEvt)
            }
            if (node.cool){
                await node.device.events.thermostat.occupiedCoolingSetpoint$Changed.off(node.coolSetpointEvt)
            }
             //Remove Node-RED Custom  Events
             node.removeAllListeners('serverReady')
             //Remove from Bridge Node Registered
             let index = node.bridge.registered.indexOf(node);
             if (index > -1) { 
                 node.bridge.registered.splice(index, 1); 
             }
             if (removed){
                 await node.device.close()
             }
             done();
        });


        function sysMode(msg, newData){
            return new Promise((resolve) => {
                let modes = {0 : 'off', 3 : 'cool', 4 : 'heat'}
                let systemMode
                if (hasProperty(msg.payload, 'mode')){
                    switch (msg.payload.mode) {
                        case 'heat':
                            systemMode = 4
                            break;
                        case 'cool':
                            systemMode = 3
                            break;
                        case 'off':
                            systemMode = 0
                            break
                        default:
                            systemMode = node.device.state.thermostat.systemMode
                            break;
                    }
                    newData.thermostat.systemMode = systemMode
                    msg.payload.mode = modes[systemMode]
                } else {
                    systemMode = node.device.state.thermostat.systemMode
                    newData.thermostat.systemMode = systemMode
                    msg.payload.mode = modes[systemMode]
                }
                resolve(systemMode)
            })
        }


        function setPoint(msg, newData, systemMode){
            return new Promise((resolve) => {
                if (hasProperty(msg.payload, 'setPoint') && isNumber(msg.payload.setPoint)) {
                    if (msg.payload.setPoint < 50) {msg.payload.setPoint = msg.payload.setPoint*100 }
                    if (systemMode == 4){
                        newData.thermostat.occupiedHeatingSetpoint = msg.payload.setPoint
                    } else if (systemMode == 3){
                        newData.thermostat.occupiedCoolingSetpoint = msg.payload.setPoint
                    } 
                } else {
                    if (systemMode == 4){
                        newData.thermostat.occupiedHeatingSetpoint = node.device.state.thermostat.occupiedHeatingSetpoint
                        msg.payload.setPoint = node.device.state.thermostat.occupiedHeatingSetpoint
                    } else if (systemMode == 3){
                        msg.payload.setPoint = node.device.state.thermostat.occupiedCoolingSetpoint
                        newData.thermostat.occupiedCoolingSetpoint = node.device.state.thermostat.occupiedCoolingSetpoint
                    } 
                }
                resolve()
            })
        }

        function temperature(msg, newData){
            return new Promise((resolve) => {
                if (hasProperty(msg.payload, 'temperature') && isNumber(msg.payload.temperature)) {
                    if (msg.payload.temperature < 50) {msg.payload.temperature = msg.payload.temperature*100}
                    newData.thermostat.localTemperature = msg.payload.temperature
                    node.ctx.set(node.id+"-temperature",  msg.payload.temperature)
                    node.temperature = msg.payload.temperature
                } else {
                    msg.payload.temperature = node.device.state.thermostat.localTemperature
                    newData.thermostat.localTemperature = node.device.state.thermostat.localTemperature
                }
                resolve()
            })
        }

        //Wait till server is started
        function waitforserver(node) {
            if (!node.bridge.serverReady) {
              setTimeout(waitforserver, 100, node)
            } else {
                node.log('Registering Child......')
                node.bridge.emit('registerChild', node)
            }
        }
        waitforserver(node)
        
    }
    RED.nodes.registerType("matterthermostat",MatterThermostat)
}

