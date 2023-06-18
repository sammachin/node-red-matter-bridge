
module.exports = function(RED) {
    function MatterOnOffLight(config) {
        RED.nodes.createNode(this,config);
        var node = this;
        node.bridge = RED.nodes.getNode(config.bridge);
        node.name = config.name
        console.log(`Loading Device node ${node.id}`)
        node.status({fill:"red",shape:"ring",text:"not running"});
        this.on('input', function(msg) {
            if (typeof msg.payload == "boolean") {
                node.device.onOff(msg.payload)
            } else {
                switch (msg.payload){
                    case '1':
                        node.device.onOff(true)
                        break
                    case '0':
                        node.device.onOff(false)
                        break
                    case 'on':
                        node.device.onOff(true)
                        break
                    case 'off':
                        node.device.onOff(false)
                        break
                    case 'toggle':
                        node.device.toggle()
                        break
                }
            }
        });
        this.on('serverReady', function() {
            this.status({fill:"green",shape:"dot",text:"ready"});
        })
        this.on('state', function(data){
            console.log(data)
            var msg = {};
            msg.payload=data
            node.send(msg);
        })
        this.on('close', function(removed, done) {
            if (removed) {
                // This node has been disabled/deleted
            } else {
                // This node is being restarted
            }
            done();
        });
        node.bridge.emit('registerChild', node)
    }
    RED.nodes.registerType("matteronofflight",MatterOnOffLight);
}