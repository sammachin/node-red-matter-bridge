const { IlluminanceMeasurement } = require("@project-chip/matter-node.js/cluster");

module.exports = function(RED) {
    function MatterLightSensor(config) {
        RED.nodes.createNode(this,config);

        var node = this;
        node.bridge = RED.nodes.getNode(config.bridge);
        node.name = config.name
        node.minlevel = config.minlevel 
        node.maxlevel = config.maxlevel
        console.log(`Loading Device node ${node.id}`)
        console.log(`INITIAL STATE: ${config.initial}`)

        node.status({fill:"red",shape:"ring",text:"not running"});
        this.on('input', function(msg) {
            node.device.set({illuminanceMeasurement: {measuredValue: msg.payload}})
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
    RED.nodes.registerType("matterlightsensor",MatterLightSensor);
}