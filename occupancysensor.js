
function typeToBitmap(value){
    let b = (Number(value)).toString(2).split('').reverse()
    let bitmap = { pir: Boolean(Number(b[0])), ultrasonic: Boolean(Number(b[1])), physicalContact: Boolean(Number(b[2])) }
    return bitmap
}

module.exports = function(RED) {
    function MatterOccupancySensor(config) {
        console.log(config.sensorType)
        RED.nodes.createNode(this,config);
        var node = this;
        node.bridge = RED.nodes.getNode(config.bridge);
        node.name = config.name
        node.sensorType = Number(config.sensorType)-1
        node.sensorTypeBitmap = typeToBitmap(config.sensorType)
        console.log(`Loading Device node ${node.id}`)
        node.status({fill:"red",shape:"ring",text:"not running"});
        this.on('input', function(msg) {
            node.device.set({occupancySensing: {occupancy: {occupied: msg.payload}}})
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
    RED.nodes.registerType("matteroccupancysensor",MatterOccupancySensor)
}