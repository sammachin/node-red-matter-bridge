const {logEndpoint, EndpointServer} = require( "@matter/main")
const { hasProperty, willUpdate } = require('./utils');

module.exports = function(RED) {
    function MatterOnOffLight(config) {
        RED.nodes.createNode(this,config);
        var node = this;
        node.bridge = RED.nodes.getNode(config.bridge);
        node.name = config.name
        this.log(`Loading Device node ${node.id}`)
        node.status({fill:"red",shape:"ring",text:"not running"});
        node.pending = false
        node.pendingmsg = null
        node.passthrough = /^true$/i.test(config.passthrough)
        node.stateEvt = function(value) {
            if ((node.pending && node.passthrough)) {
                var msg = node.pendingmsg
                msg.payload.state = node.device.state.onOff.onOff
                node.send(msg);
            } else if (!node.pending){
                var msg = {payload : {}};
                msg.payload.state = node.device.state.onOff.onOff
                node.send(msg);
            }
            node.pending = false
        };

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
                if (msg.payload.state == undefined || typeof(msg.payload) != "object"){
                    msg.payload = state = {state: msg.payload}
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
                    }
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
                
            }
            
        });
        
        this.on('serverReady', function() {
            var node = this
            node.device.events.onOff.onOff$Changed.on(node.stateEvt) 
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
            await node.device.events.onOff.onOff$Changed.off(node.stateEvt)
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
    RED.nodes.registerType("matteronofflight",MatterOnOffLight);
}