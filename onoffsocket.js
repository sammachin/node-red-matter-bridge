
module.exports = function(RED) {
    function MatterOnOffSocket(config) {
        RED.nodes.createNode(this,config);
        var node = this;
        node.bridge = RED.nodes.getNode(config.bridge);
        node.name = config.name
        node.pending = false
        node.pendingmsg = null
        node.passthrough = /^true$/i.test(config.passthrough)
        console.log(`Loading Device node ${node.id}`)
        node.status({fill:"red",shape:"ring",text:"not running"});
        this.on('input', function(msg) {
            node.pending = true
            node.pendingmsg = msg
            if (msg.payload.state == undefined || typeof(msg.payload) != "object"){
                msg.payload = state = {state: msg.payload}
            }
            if (typeof msg.payload.state == "boolean") {
                node.device.setOnOff(msg.payload.state)
            } else {
                switch (msg.payload.state){
                    case '1':
                        node.device.setOnOff(true)
                        break
                    case '0':
                        node.device.setOnOff(false)
                        break
                    case 1:
                        node.device.setOnOff(true)
                        break
                    case 0:
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

        this.on('close', function(removed, done) {
            this.removeAllListeners('state')
            this.removeAllListeners('serverReady')
            this.removeAllListeners('state')
            if (removed) {
                // This node has been disabled/deleted
            } else {
                // This node is being restarted
            }
            done();
        });
        node.bridge.emit('registerChild', node)
    }
    RED.nodes.registerType("matteronoffsocket",MatterOnOffSocket);
}