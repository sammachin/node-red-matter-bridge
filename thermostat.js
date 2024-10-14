const thermostat = require("./devices/thermostat");

module.exports = function(RED) {
    function MatterThermostat(config) {
        RED.nodes.createNode(this,config);
        var node = this;
        node.bridge = RED.nodes.getNode(config.bridge);
        node.name = config.name
        node.mode = config.mode
        node.heat = (config.mode == 'heat' || 'heatcool')
        node.cool = (config.mode == 'cool' || 'heatcool')
        console.log(`Loading Device node ${node.id}`)
        node.status({fill:"red",shape:"ring",text:"not running"});
        node.pending = false
        node.passthrough = /^true$/i.test(config.passthrough)
        this.on('input', function(msg) {
            if (msg.topic == 'state'){
                msg.payload = node.device.state
                node.send(msg)
            } else {
                if (msg.payload.mode){
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
                        default:
                            systemMode =  node.devicestate.thermostat.systemMode
                            break;
                    }
                    let values = {systemMode: systemMode}
                    if (msg.payload.setpoint){
                        if (systemMode == 4){
                            values.occupiedHeatingSetpoint = msg.payload.setpoint
                        } else if (systemMode == 3){
                            values.occupiedCoolingSetpoint = msg.payload.setpoint
                        } 
                    }
                    node.device.set({
                        thermostat: values
                    })
                }
                if (msg.payload.temperature){
                    node.device.set({thermostat : {localTemperature : msg.payload.temperature}})
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
            data = {'mode' : modes[value]}
            if (value == 4){
                data.setpoint = node.device.state.thermostat.occupiedHeatingSetpoint
            } else if (value == 3){
                data.setpoint = node.device.state.thermostat.occupiedCoolingSetpoint
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
        
        this.on('temp', function(mode, value){
            data = {'mode' : mode, setPoint : value}
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

        this.on('close', function(removed, done) {
            this.removeAllListeners('serverReady')
            this.removeAllListeners('identify')
            this.removeAllListeners('mode')
            this.removeAllListeners('temp')


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

