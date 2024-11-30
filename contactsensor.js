const {logEndpoint, EndpointServer} = require( "@matter/main")



module.exports = function(RED) {
    function MatterContactSensor(config) {
        RED.nodes.createNode(this,config);

        var node = this;
        node.bridge = RED.nodes.getNode(config.bridge);
        node.name = config.name
        node.initial = config.initial == "true";
        this.log(`Loading Device node ${node.id}`)
        this.log(`INITIAL STATE: ${config.initial}`)
        node.ctx =  this.context().global;
        node.stateValue = node.ctx.get(node.id+"-stateValue") || null
        node.status({fill:"red",shape:"ring",text:"not running"});
        this.on('input', function(msg) {
            if (msg.topic == 'state'){
                msg.payload = node.device.state
                node.send(msg)
                logEndpoint(EndpointServer.forEndpoint(node.bridge.matterServer))
            } else {
                node.device.set({booleanState: {stateValue: msg.payload}})
                node.ctx.set(node.id+"-stateValue",  msg.payload)
                node.stateValue = msg.payload
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


        this.on('close', function(removed, done) {
            this.log("Closing device "+this.id)
            this.off('serverReady')
            this.off('identify')
            this.device.close().then(() => {
                done();
            })
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
    RED.nodes.registerType("mattercontactsensor",MatterContactSensor);
}