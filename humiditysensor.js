const {logEndpoint, EndpointServer} = require( "@matter/main")

module.exports = function(RED) {
    function MatterHumiditySensor(config) {
        RED.nodes.createNode(this,config);

        var node = this;
        node.bridge = RED.nodes.getNode(config.bridge);
        node.name = config.name
        node.minlevel = config.minlevel*100
        node.maxlevel = config.maxlevel*100
        node.ctx =  this.context().global;
        node.measuredValue = node.ctx.get(node.id+"-measuredValue") || null
        console.log(`Loading Device node ${node.id}`)
        node.status({fill:"red",shape:"ring",text:"not running"});
        this.on('input', function(msg) {
            if (msg.topic == 'state'){
                msg.payload = node.device.state
                node.send(msg)
                logEndpoint(EndpointServer.forEndpoint(node.bridge.matterServer))
            } else {
                let value = msg.payload*100
                node.device.set({relativeHumidityMeasurement: {measuredValue: value}})
                node.ctx.set(node.id+"-measuredValue",  value)
                node.measuredValue = value
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
    RED.nodes.registerType("matterhumiditysensor",MatterHumiditySensor)
}