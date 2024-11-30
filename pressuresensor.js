const {logEndpoint, EndpointServer} = require( "@matter/main")

module.exports = function(RED) {
    function MatterPressureSensor(config) {
        RED.nodes.createNode(this,config);

        var node = this;
        node.bridge = RED.nodes.getNode(config.bridge);
        node.name = config.name
        node.minlevel = config.minlevel*10
        node.maxlevel = config.maxlevel*10
        node.ctx =  this.context().global;
        node.measuredValue = node.ctx.get(node.id+"-measuredValue") || null
        this.log(`Loading Device node ${node.id}`)
        node.status({fill:"red",shape:"ring",text:"not running"});
        this.on('input', function(msg) {
            if (msg.topic == 'state'){
                msg.payload = node.device.state
                node.send(msg)
                logEndpoint(EndpointServer.forEndpoint(node.bridge.matterServer))
            } else {
                let value = msg.payload*10
                node.device.set({pressureMeasurement: {measuredValue: value }})
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
    RED.nodes.registerType("matterpressuresensor",MatterPressureSensor)
}