const {logEndpoint, EndpointServer} = require( "@matter/main")
const { hasProperty, willUpdate } = require('./utils');


module.exports = function(RED) {
    function MatterDoorLock(config) {
        RED.nodes.createNode(this,config);
        var node = this;
        node.bridge = RED.nodes.getNode(config.bridge);
        node.name = config.name
        this.log(`Loading Device node ${node.id}`)
        node.status({fill:"red",shape:"ring",text:"not running"});
        node.pending = false
        node.pendingmsg = null
        node.ctx =  this.context().global;
        node.lockState = node.ctx.get(node.id+"-lockState") || null
        node.passthrough = /^true$/i.test(config.passthrough)
        node.bat = config.bat
        node.topic = config.topic || false
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
                if (msg.payload.state == undefined || typeof(msg.payload) != "object"){
                    msg.payload = state = {state: msg.payload}
                }
                let lockState 
                switch (msg.payload.state){
                    case '1':
                    case 1:
                    case 'lock':
                    case 'locked':
                    case true:
                        lockState = 1
                        break
                    case '0':
                    case 0:
                    case 'unlock':
                    case 'unlocked':
                    case false:
                        lockState = 2
                        break
                }
                node.ctx.set(node.id+"-lockState",  lockState)
                node.lockState = lockState
                newData = {
                    doorLock: {
                        lockState: lockState,
                    }
                }
                if (willUpdate.call(node.device, newData)) {
                    node.debug(`WILL update, ${newData}`)
                    node.pending = true
                    node.pendingmsg = msg
                    node.device.set(newData).catch((err) => {node.debug(err); node.error('Invalid Input')})
                } else {
                    node.debug(`WONT update, ${newData}`)
                    if (node.passthrough){
                        node.send(msg);
                    }
                }
                break
            }
        });

        this.on('serverReady', function() {
            var node = this
            node.device.events.doorLock.lockState$Changed.on(node.stateEvt) 
            node.device.events.identify.startIdentifying.on(node.identifyEvt)
            node.device.events.identify.stopIdentifying.on(node.identifyEvt)
            node.status({fill:"green",shape:"dot",text:"ready"});    
        })
        
        node.stateEvt = function(value, oldValue, context) {
            let eventSource = {}
            if (hasProperty(context, 'offline')) {
                eventSource.local = true
            } else {
                eventSource.local = false
                eventSource.srcAddress = context.exchange.channel.channel.peerAddress
                eventSource.srcPort = context.exchange.channel.channel.peerPort
                eventSource.fabric = node.bridge.matterServer.state.commissioning.fabrics[context.fabric]
            }
            let states = {0 :'unlocked', 1 : 'locked', 2 : 'unlocked'}
            node.lockState = value
            state=states[value]
            if ((node.pending && node.passthrough)) {
                var msg = node.pendingmsg
                msg.eventSource = eventSource
                msg.payload.state=state
                node.send(msg);
            } else if (!node.pending){
                var msg = {payload : {}};
                if (node.topic) {msg.topic = node.topic}
                msg.eventSource = eventSource
                msg.payload.state=state
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
            await node.device.events.doorLock.lockState$Changed.off(node.stateEvt)
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
    RED.nodes.registerType("matterdoorlock",MatterDoorLock);
}
