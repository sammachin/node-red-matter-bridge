const {logEndpoint, EndpointServer} = require( "@matter/main")

const { hasProperty, isNumber } = require('./utils');

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
            if (msg.topic == 'state'){
                msg.payload = node.device.state
                node.send(msg)
            } else {
                let newData = {thermostat : {}}
                if (hasProperty(msg.payload, 'mode') || (hasProperty(msg.payload, 'setPoint') && isNumber(msg.payload.setPoint))){
                    node.pending = true
                    node.pendingmsg = msg
                    let systemMode 
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
                            systemMode =  node.device.state.thermostat.systemMode
                            break;
                    }
                     newData.thermostat.systemMode = systemMode}
                    if (hasProperty(msg.payload, 'setPoint') && isNumber(msg.payload.setPoint)) {
                        if (systemMode == 4){
                            newData.thermostat.occupiedHeatingSetpoint = msg.payload.setPoint
                        } else if (systemMode == 3){
                            newData.thermostat.occupiedCoolingSetpoint = msg.payload.setPoint
                        } 
                    }   
                }
                if (hasProperty(msg.payload, 'temperature') && isNumber(msg.payload.temperature)) {
                    newData.thermostat.localTemperature = msg.payload.temperature
                    node.ctx.set(node.id+"-temperature",  msg.payload.temperature)
                    node.temperature = msg.payload.temperature   
                }
                //If values are changed then set them & wait for callback otherwise send msg on
                if (willUpdate.call(node.device, newData)) {
                    this.debug('WILL UPDATE')
                    node.pending = true
                    node.pendingmsg = msg
                    node.device.set(newData)
                } else {
                    this.debug('WONT UPDATE')
                    if (node.passthrough){
                        node.send(msg);
                    }
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

