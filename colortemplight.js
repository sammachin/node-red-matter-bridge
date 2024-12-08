const logEndpoint = require( "@project-chip/matter.js/device").logEndpoint;
const EndpointServer = require("@project-chip/matter.js/endpoint").EndpointServer;
const { hasProperty, isNumber } = require('./utils');


module.exports = function(RED) {
    function MatterColorTempLight(config) {
        RED.nodes.createNode(this,config);
        var node = this;
        node.bridge = RED.nodes.getNode(config.bridge);
        node.name = config.name
        node.range = config.range
        node.pending = false
        node.pendingmsg = null
        node.passthrough = /^true$/i.test(config.passthrough)
        node.tempformat = config.tempformat || "kelvin" //Default to kelvin for legacy
        node.levelstep = Number(config.levelstep)
        node.bat = config.bat
        this.log(`Loading Device node ${node.id}`)
        node.status({fill:"red",shape:"ring",text:"not running"});
        this.on('input', function(msg) {
            if (msg.topic == 'state'){
                if (hasProperty(msg, 'payload')) {
                    node.device.set(msg.payload)
                }
                msg.payload = node.device.state
                node.send(msg)
            } else {
                node.pending = true
                node.pendingmsg = msg
                if (msg.payload.state == undefined) {
                    msg.payload.state = node.device.state.onOff.onOff
                }
                if (msg.payload.level == undefined) {
                    msg.payload.level = node.device.state.levelControl.currentLevel
                }
                if (node.range == "100"){ msg.payload.level = Math.round(msg.payload.level*2.54)}
                if (hasProperty(msg.payload, 'temp')) {
                    var mireds = 1000000/msg.payload.temp
                }  else {
                    var mireds = node.device.state.colorControl.colorTemperatureMireds
                }
                node.device.set({
                    levelControl: {
                        currentLevel: msg.payload.level
                    },
                    colorControl: {
                        colorTemperatureMireds : mireds
                    }
                })

                switch (msg.payload.state){
                    case '1':
                    case 1:
                    case 'on':
                    case true:
                        node.device.set({
                            onOff: {
                                onOff: true,
                            }
                        })
                        break
                    case '0':
                    case 0:
                    case 'off':
                    case false:
                        node.device.set({
                            onOff: {
                                onOff: false,
                            }
                        })
                        break
                    case 'toggle':
                        node.device.set({
                            onOff: {
                                        onOff: !node.device.state.onOff.onOff,
                                    }
                        })
                        break
                    
                }
            }
        });

        this.on('serverReady', function() {
            this.status({fill:"green",shape:"dot",text:"ready"});
        })

        this.on('state', function(data){
            if ((node.pending && node.passthrough)) {
                var msg = node.pendingmsg
                msg.payload.state = node.device.state.onOff.onOff
                msg.payload.level = node.device.state.levelControl.currentLevel
                if (node.range == "100"){ msg.payload.level = Math.round(msg.payload.level/2.54)}
                msg.payload.temp = Math.floor(1000000/node.device.state.colorControl.colorTemperatureMireds)
                node.send(msg);
            } else if (!node.pending){
                var msg = {payload : {}};
                msg.payload.state = node.device.state.onOff.onOff
                msg.payload.level = node.device.state.levelControl.currentLevel
                if (node.range == "100"){ msg.payload.level = Math.round(msg.payload.level/2.54)}
                msg.payload.temp = Math.floor(1000000/node.device.state.colorControl.colorTemperatureMireds)
                node.send(msg);
            }
            node.pending = false
        })

        this.on('identify', function(data){
            if (data){
                this.status({fill:"blue",shape:"dot",text:"identify"});
            } else {
                this.status({fill:"green",shape:"dot",text:"ready"});
            }
            
        })

        this.on('close', function(removed, done) {
            this.off('state')
            this.off('serverReady')
            this.off('identify')
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
    RED.nodes.registerType("mattercolortemplight",MatterColorTempLight);
}