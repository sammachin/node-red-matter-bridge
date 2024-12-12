const {logEndpoint, EndpointServer} = require( "@matter/main")

const { hasProperty, willUpdate } = require('./utils');


module.exports = function(RED) {
    function MatterFullColorLight(config) {
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
        node.bat = config.bat;
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
                    if (msg.payload.state == undefined) {
                        msg.payload.state = node.device.state.onOff.onOff
                    }
                    if (hasProperty(msg.payload, 'level') && node.range == "100"){ msg.payload.level = Math.round(msg.payload.level*2.54)}
                    if (hasProperty(msg.payload, 'increaseLevel')){
                        if (node.range == "100") { 
                            msg.payload.level = node.device.state.levelControl.currentLevel+Math.round(node.levelstep*2.54)
                        } else {
                            msg.payload.level = node.device.state.levelControl.currentLevel+node.levelstep
                        }
                    }
                    if (hasProperty(msg.payload, 'decreaseLevel')){
                        if (node.range == "100") {
                            msg.payload.level = node.device.state.levelControl.currentLevel-Math.round(node.levelstep*2.54)
                        } else {
                            msg.payload.level = node.device.state.levelControl.currentLevel-node.levelstep
                        }
                    }
                    if (msg.payload.level == undefined) {
                        msg.payload.level = node.device.state.levelControl.currentLevel
                    }
                    if ((hasProperty(msg.payload, 'hue') || hasProperty(msg.payload, 'sat')) && hasProperty(msg.payload, 'temp')) {
                        node.error("Can't set Colour Temp and Hue/Sat at same time")
                    } else {
                        if (hasProperty(msg.payload, 'hue') || hasProperty(msg.payload, 'sat')){
                            msg.payload.hue = msg.payload.hue ? msg.payload.hue : node.device.state.colorControl.currentHue
                            msg.payload.sat = msg.payload.sat ? msg.payload.sat : node.device.state.colorControl.currentSaturation
                            newcolor = {
                                colorMode: 0,
                                currentHue: msg.payload.hue,
                                currentSaturation: msg.payload.sat
                            }
                        } else if (hasProperty(msg.payload, 'temp')) {
                            if (node.tempformat == 'kelvin'){
                                var mireds = 1000000/msg.payload.temp
                            } else {
                                var mireds = msg.payload.temp
                            } 
                            newcolor = {
                                colorMode: 2,
                                colorTemperatureMireds : mireds
                            }
                        }
                        else {
                                newcolor = {colorMode: node.device.state.colorControl.colorMode}
                        }
                    }
                    if (typeof msg.payload.state != "boolean") {
                        switch (msg.payload.state){
                            case '1':
                            case 1:
                            case 'on':
                                msg.payload.state = true
                                break
                            case '0':
                            case 0:
                            case 'off':
                                msg.payload.state = false
                                break
                            case 'toggle':
                                msg.payload.state = !node.device.state.onOff.onOff
                                break
                        }
                    }
                    let newData = {
                        onOff: {
                            onOff: msg.payload.state,
                        },
                        levelControl: {
                            currentLevel: Math.max(2, Math.min(254, msg.payload.level))
                        },
                        colorControl: newcolor
                    }
                    //If values are changed then set them & wait for callback otherwise send msg on
                    if (willUpdate.call(node.device, newData)) {
                        node.debug(`WILL update, ${newData}`)
                        node.pending = true
                        node.pendingmsg = msg
                        node.device.set(newData)
                    } else {
                        node.debug(`WONT update, ${newData}`)
                        if (node.passthrough){
                            node.send(msg);
                        }
                    }
                    break;
            }
        });
        
        this.on('serverReady', function() {
            var node = this
            node.device.events.identify.startIdentifying.on(node.identifyEvt)
            node.device.events.identify.stopIdentifying.on(node.identifyEvt)
            node.device.events.onOff.onOff$Changed.on(node.stateEvt) 
            node.device.events.levelControl.currentLevel$Changed.on(node.stateEvt)
            node.device.events.colorControl.colorTemperatureMireds$Changed.on(node.stateEvt)
            node.device.events.colorControl.currentHue$Changed.on(node.stateEvt)
            node.device.events.colorControl.currentSaturation$Changed.on(node.stateEvt)
            node.status({fill:"green",shape:"dot",text:"ready"});    
        })

        node.stateEvt = function(data){
            if ((node.pending && node.passthrough)) {
                var msg = node.pendingmsg
                msg.payload.state = node.device.state.onOff.onOff
                msg.payload.level = node.device.state.levelControl.currentLevel
                if (node.range == "100"){ msg.payload.level = Math.round(msg.payload.level/2.54)}
                if (node.device.state.colorControl.colorMode == 0){
                    msg.payload.hue = node.device.state.colorControl.currentHue
                    msg.payload.sat = node.device.state.colorControl.currentSaturation
                }
                else if (node.device.state.colorControl.colorMode == 2){
                    if (node.tempformat == 'kelvin'){
                        msg.payload.temp = Math.floor(1000000/node.device.state.colorControl.colorTemperatureMireds)
                    } else {
                        msg.payload.temp = node.device.state.colorControl.colorTemperatureMireds
                    } 
                } else {
                    node.error(`Unknown color mode: ${node.device.state.colorControl.colorMode}`)
                }
                node.send(msg);
            } else if (!node.pending){
                var msg = {payload : {}};
                msg.payload.state = node.device.state.onOff.onOff
                msg.payload.level = node.device.state.levelControl.currentLevel
                if (node.range == "100"){ msg.payload.level = Math.round(msg.payload.level/2.54)}
                if (node.device.state.colorControl.colorMode == 0){
                    msg.payload.hue = node.device.state.colorControl.currentHue
                    msg.payload.sat = node.device.state.colorControl.currentSaturation
                }
                else if (node.device.state.colorControl.colorMode == 2){
                    msg.payload.temp = Math.floor(1000000/node.device.state.colorControl.colorTemperatureMireds)
                } else {
                    node.error(`Unknown color mode: ${node.device.state.colorControl.colorMode}`)
                }
                
                node.send(msg);
            }
            node.pending = false
        }

    

        this.on('close', async function(removed, done) {
            let node = this
            let rtype = removed ? 'Device was removed/disabled' : 'Device was restarted'
            node.log(`Closing device: ${this.id}, ${rtype}`)
            //Remove Matter.js  Events
            await node.device.events.identify.startIdentifying.off(node.identifyEvt)
            await node.device.events.identify.stopIdentifying.off(node.identifyEvt)
            await node.device.events.onOff.onOff$Changed.off(node.stateEvt)
            await node.device.events.levelControl.currentLevel$Changed.off(node.stateEvt)
            await node.device.events.colorControl.colorTemperatureMireds$Changed.off(node.stateEvt)
            await node.device.events.colorControl.currentHue$Changed.off(node.stateEvt)
            await node.device.events.colorControl.currentSaturation$Changed.off(node.stateEvt)
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
    RED.nodes.registerType("matterfullcolorlight",MatterFullColorLight);
}