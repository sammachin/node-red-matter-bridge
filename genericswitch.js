const {logEndpoint, EndpointServer} = require( "@matter/main")


module.exports = function(RED) {
    function MatterGenericSwitch(config) {
        RED.nodes.createNode(this,config);

        var node = this;
        node.bridge = RED.nodes.getNode(config.bridge);
        node.name = config.name
        node.switchtype = config.switchtype
        node.positions = Number(config.positions)
        node.multiPressMax = Number(config.multiPressMax)
        node.longPressDelay = Number(config.longPressDelay)
        node.multiPressDelay = Number(config.multiPressDelay)
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
            if (msg.topic == 'state'){
                msg.payload = node.device.state
                node.send(msg)
                logEndpoint(EndpointServer.forEndpoint(node.bridge.matterServer))
            } else {
                ep = node.device
                let t
                switch (msg.payload.type.toLowerCase()) {
                    case "single":
                        t = ep.state.switch.longPressDelay/2
                        press(ep, 1)
                        setTimeout(press, t, ep, 0)
                        break
                    case "double":
                        t = ep.state.switch.longPressDelay/4
                        press(ep, 1)
                        setTimeout(press, t, ep, 0)
                        setTimeout(press, t*2, ep, 1)
                        setTimeout(press, t*3, ep, 0)
                        break            
                    case "long":
                        t = ep.state.switch.multiPressDelay*1.5
                        press(ep, 1)
                        setTimeout(press, t, ep, 0)
                        break
                    case "position":
                        ep.set({switch : {currentPosition: msg.payload.position}})
                        break
                }
            }
        });
        
        this.on('serverReady', function() {
            var node = this
            node.device.events.identify.startIdentifying.on(node.identifyEvt)
            node.device.events.identify.stopIdentifying.on(node.identifyEvt)
            node.status({fill:"green",shape:"dot",text:"ready"});    
        })
        
        this.on('close', async function(removed, done) {
            let node = this
            let rtype = removed ? 'Device was removed/disabled' : 'Device was restarted'
            node.log(`Closing device: ${this.id}, ${rtype}`)
            //Remove Matter.js  Events
            await node.device.events.identify.startIdentifying.off(node.identifyEvt)
            await node.device.events.identify.stopIdentifying.off(node.identifyEvt)
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
    RED.nodes.registerType("mattergenericswitch",MatterGenericSwitch)
}

function press(ep, pos){
    ep.set({switch : {currentPosition: pos}})
}