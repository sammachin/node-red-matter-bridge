
module.exports = function(RED) {
    function MatterDimmableLight(config) {
        RED.nodes.createNode(this,config);
        var node = this;
        node.bridge = RED.nodes.getNode(config.bridge);
        node.name = config.name
        node.range = config.range
        console.log(`Loading Device node ${node.id}`)
        node.status({fill:"red",shape:"ring",text:"not running"});
        this.on('input', function(msg) {
            if (msg.payload.state == undefined) {
                msg.payload.state = node.device.getOnOff()
            }
            if (msg.payload.level == undefined) {
                msg.payload.level = node.device.getCurrentLevel()
            }
            else {
                if (node.range == "100"){ msg.payload.level = Math.round(msg.payload.level*2.54)}
            }
            node.device.setCurrentLevel(msg.payload.level)
            switch (msg.payload.state){
                case '1':
                    node.device.setOnOff(true)
                    break
                case '0':
                    node.device.setOnOff(false)
                    break
                case 'on':
                    node.device.setOnOff(true)
                    break
                case 'off':
                    node.device.setOnOff(false)
                    break
                case 'toggle':
                    node.device.toggle()
                    break
                case false:
                    node.device.setOnOff(false)
                    break
                case true:
                    node.device.setOnOff(true)
                    break
            }
        });
        this.on('serverReady', function() {
            this.status({fill:"green",shape:"dot",text:"ready"});
        })
        this.on('state', function(data){
            console.log(node.id, data)
            var msg = {payload : {}};
            msg.payload.state = node.device.getOnOff()
            msg.payload.level = node.device.getCurrentLevel()
            if (node.range == "100"){ msg.payload.level = Math.round(msg.payload.level/2.54)}
            node.send(msg);
        })
        this.on('close', function(removed, done) {
            this.off('state')
            this.off('serverReady')
            this.off('state')
            if (removed) {
                // This node has been disabled/deleted
            } else {
                // This node is being restarted
            }
            done();
        });
        node.bridge.emit('registerChild', node)
    }
    RED.nodes.registerType("matterdimmablelight",MatterDimmableLight);
}