const {logEndpoint, EndpointServer} = require( "@matter/main")

const { hasProperty, isNumber } = require('./utils');

module.exports = function(RED) {
    function MatterThermostat(config) {
        RED.nodes.createNode(this,config);
        var node = this;
        node.bridge = RED.nodes.getNode(config.bridge);
        node.name = config.name
        node.mode = config.mode
        node.heat = (config.mode == 'heat' || 'heatcool')
        node.cool = (config.mode == 'cool' || 'heatcool')
        node.ctx =  this.context().global;
        node.values = node.ctx.get(node.id+"-values") || null
        node.temperature = node.ctx.get(node.id+"-temperature") || null

        console.log(`Loading Device node ${node.id}`)
        node.status({fill:"red",shape:"ring",text:"not running"});
        node.pending = false
        node.passthrough = /^true$/i.test(config.passthrough)
        this.on('input', function(msg) {
            if (msg.topic == 'state'){
                msg.payload = node.device.state
                node.send(msg)
            } else {
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
                    let values = {systemMode: systemMode}
                    if (hasProperty(msg.payload, 'setPoint') && isNumber(msg.payload.setPoint)) {
                        if (systemMode == 4){
                            values.occupiedHeatingSetpoint = msg.payload.setPoint
                        } else if (systemMode == 3){
                            values.occupiedCoolingSetpoint = msg.payload.setPoint
                        } 
                    }
                    node.device.set({thermostat: values})
                    node.ctx.set(node.id+"-values",  values)
                    node.values = values
                }
                if (hasProperty(msg.payload, 'temperature') && isNumber(msg.payload.temperature)) {
                    node.pending = true
                    node.pendingmsg = msg
                    node.device.set({thermostat : {localTemperature : msg.payload.temperature}})
                    node.ctx.set(node.id+"-temperature",  msg.payload.temperature)
                    node.temperature = msg.payload.temperature
                    if (!hasProperty(msg.payload, 'setPoint') && !hasProperty(msg.payload, 'mode')){
                        this.emit('temp', msg.payload.temperature)
                    }
                }
            }
        });
        
        this.on('serverReady', function() {
            this.status({fill:"green",shape:"dot",text:"ready"});

        })
        
        this.on('identify', function(data){
            if (data){
                this.status({fill:"blue",shape:"dot",text:"identify"});
            } else {
                this.status({fill:"green",shape:"dot",text:"ready"});
            }
            
        })

        this.on('mode', function(value){
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
        })
        
        this.on('setpoint', function(mode, value){
            let temp = node.device.state.thermostat.localTemperature
            data = {'mode' : mode, setPoint : value, temperature: temp}
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
        })

        this.on('temp', function(value){
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
        })
        this.on('close', function(removed, done) {
            this.removeAllListeners('serverReady')
            this.removeAllListeners('identify')
            this.removeAllListeners('mode')
            this.removeAllListeners('temp')
            this.removeAllListeners('setpoint')


            if (removed) {
                // This node has been disabled/deleted
            } else {
                // This node is being restarted
            }
            done();
        });
        //Wait till server is started
        function waitforserver(node) {
            if (!node.bridge.serverReady) {
              setTimeout(waitforserver, 100, node)
            } else {
                console.log('Registering Child......')
                node.bridge.emit('registerChild', node)
            }
        }
        waitforserver(node)
        
    }
    RED.nodes.registerType("matterthermostat",MatterThermostat)
}

