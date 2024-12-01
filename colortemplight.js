const {logEndpoint, EndpointServer} = require( "@matter/main")
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
        this.log(`Loading Device node ${node.id}`)
        node.status({fill:"red",shape:"ring",text:"not running"});

        node.identifying = false
        node.identifyEvt = function() {
            node.identifying = !node.identifying
            if (node.identifying){
                node.status({fill:"blue",shape:"dot",text:"identify"});
            } else {
                node.status({fill:"green",shape:"dot",text:"ready"});
            }
        };
        node.stateEvt = function(value) {
            if ((node.pending && node.passthrough)) {
                var msg = node.pendingmsg
                msg.payload.state = node.device.state.onOff.onOff
                msg.payload.level = node.device.state.levelControl.currentLevel
                if (node.range == "100"){ msg.payload.level = Math.round(msg.payload.level/2.54)}
                if (node.tempformat == 'kelvin'){
                    msg.payload.temp = Math.floor(1000000/node.device.state.colorControl.colorTemperatureMireds)
                } else {
                    msg.payload.temp = node.device.state.colorControl.colorTemperatureMireds
                }
                node.send(msg);
            } else if (!node.pending){
                var msg = {payload : {}};
                msg.payload.state = node.device.state.onOff.onOff
                msg.payload.level = node.device.state.levelControl.currentLevel
                if (node.range == "100"){ msg.payload.level = Math.round(msg.payload.level/2.54)}
                if (node.tempformat == 'kelvin'){
                    msg.payload.temp = Math.floor(1000000/node.device.state.colorControl.colorTemperatureMireds)
                } else {
                    msg.payload.temp = node.device.state.colorControl.colorTemperatureMireds
                }
                node.send(msg);
            }
            node.pending = false
        };


        this.on('input', function(msg) {
            if (msg.topic == 'state'){
                msg.payload = node.device.state
                node.send(msg)
                logEndpoint(EndpointServer.forEndpoint(node.bridge.matterServer))
            } else {
                node.pending = true
                node.pendingmsg = msg
                if (msg.payload.state == undefined) {
                    msg.payload.state = node.device.state.onOff.onOff
                }
                if (hasProperty(msg.payload, 'increaseLevel')){
                    msg.payload.level = node.device.state.levelControl.currentLevel+node.levelstep
                }
                if (hasProperty(msg.payload, 'decreaseLevel')){
                    msg.payload.level = node.device.state.levelControl.currentLevel-node.levelstep
                }
                if (msg.payload.level == undefined) {
                    msg.payload.level = node.device.state.levelControl.currentLevel
                }
                if (node.range == "100"){ msg.payload.level = Math.round(msg.payload.level*2.54)}
                if (hasProperty(msg.payload, 'temp')) {
                    if (node.tempformat == 'kelvin'){
                        var mireds = 1000000/msg.payload.temp
                    } else {
                        var mireds = msg.payload.temp
                    } 
                }  else {
                    var mireds = node.device.state.colorControl.colorTemperatureMireds
                }
                node.device.set({
                    levelControl: {
                        currentLevel: Math.max(2, Math.min(254, msg.payload.level))
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
            var node = this
            node.device.events.onOff.onOff$Changed.on(node.stateEvt) 
            node.device.events.levelControl.currentLevel$Changed.on(node.stateEvt)
            node.device.events.colorControl.colorTemperatureMireds$Changed.on(node.stateEvt)
            node.device.events.identify.startIdentifying.on(node.identifyEvt)
            node.device.events.identify.stopIdentifying.on(node.identifyEvt)
            node.status({fill:"green",shape:"dot",text:"ready"});    
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
                if (node.tempformat == 'kelvin'){
                    msg.payload.temp = Math.floor(1000000/node.device.state.colorControl.colorTemperatureMireds)
                } else {
                    msg.payload.temp = node.device.state.colorControl.colorTemperatureMireds
                }
                node.send(msg);
            }
            node.pending = false
        })

        

        this.on('close', async function(removed, done) {
            let node = this
            let rtype = removed ? 'Device was removed/disabled' : 'Device was restarted'
            node.log(`Closing device: ${this.id}, ${rtype}`)
            //Remove Matter.js  Events
            await node.device.events.identify.startIdentifying.off(node.identifyEvt)
            await node.device.events.identify.stopIdentifying.off(node.identifyEvt)
            await node.device.events.onOff.onOff$Changed.off(node.stateEvt)
            await node.device.events.onOff.onOff$Changed.off(node.stateEvt)
            await node.device.events.levelControl.currentLevel$Changed.off(node.stateEvt)
            await node.device.events.colorControl.colorTemperatureMireds$Changed.off(node.stateEvt)
            //Remove Node-RED Custom  Events
            node.removeAllListeners('serverReady')
            await node.device.close()
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
    RED.nodes.registerType("mattercolortemplight",MatterColorTempLight);
}