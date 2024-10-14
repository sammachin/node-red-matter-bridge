const logEndpoint = require( "@project-chip/matter.js/device").logEndpoint;
const EndpointServer = require("@project-chip/matter.js/endpoint").EndpointServer;

module.exports = function(RED) {
    function MatterDoorLock(config) {
        RED.nodes.createNode(this,config);
        var node = this;
        node.bridge = RED.nodes.getNode(config.bridge);
        node.name = config.name
        console.log(`Loading Device node ${node.id}`)
        node.status({fill:"red",shape:"ring",text:"not running"});
        node.pending = false
        node.pendingmsg = null
        node.passthrough = /^true$/i.test(config.passthrough)
        this.on('input', function(msg) {
            if (msg.topic == 'state'){
                msg.payload = node.device.state
                node.send(msg)
                logEndpoint(EndpointServer.forEndpoint(node.bridge.matterServer))
            } else {
                node.pending = true
                node.pendingmsg = msg
                if (msg.payload.state == undefined || typeof(msg.payload) != "object"){
                    msg.payload = state = {state: msg.payload}
                } 
                switch (msg.payload.state){
                    case '1':
                    case 1:
                    case 'lock':
                    case 'locked':
                    case true:
                        node.device.set({
                            doorLock: {
                                lockState: 1,
                            }
                        })
                        break
                    case '0':
                    case 0:
                    case 'unlock':
                    case 'unlocked':
                    case false:
                        node.device.set({
                            doorLock: {
                                lockState: 2,
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
                msg.payload.state=data
                node.send(msg);
            } else if (!node.pending){
                var msg = {payload : {}};
                msg.payload.state=data
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
            this.removeAllListeners('state')
            this.removeAllListeners('serverReady')
            this.removeAllListeners('identify')
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
    RED.nodes.registerType("matterdoorlock",MatterDoorLock);
}