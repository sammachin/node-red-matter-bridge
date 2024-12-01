const {logEndpoint, EndpointServer} = require( "@matter/main")


function typeToBitmap(value){
    let b = (Number(value)).toString(2).split('').reverse()
    let bitmap = { pir: Boolean(Number(b[0])), ultrasonic: Boolean(Number(b[1])), physicalContact: Boolean(Number(b[2])) }
    return bitmap
}

module.exports = function(RED) {
    function MatterOccupancySensor(config) {
        RED.nodes.createNode(this,config);
        var node = this;
        node.bridge = RED.nodes.getNode(config.bridge);
        node.name = config.name
        node.sensorType = Number(config.sensorType)-1
        node.sensorTypeBitmap = typeToBitmap(config.sensorType)
        node.ctx =  this.context().global;
        node.occupied = node.ctx.get(node.id+"-occupied") || null
        this.log(`Loading Device node ${node.id}`)
        node.status({fill:"red",shape:"ring",text:"not running"});
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
            if (msg.topic == 'state'){
                msg.payload = node.device.state
                node.send(msg)
                logEndpoint(EndpointServer.forEndpoint(node.bridge.matterServer))
            } else {
                value = msg.payload
                node.device.set({occupancySensing: {occupancy: {occupied: value}}})
                node.ctx.set(node.id+"-occupied",  value)
                node.occupied = value
            }
        });

        this.on('serverReady', function() {
            var node = this
            node.device.events.identify.startIdentifying.on(node.identifyEvt)
            node.device.events.identify.stopIdentifying.on(node.identifyEvt)
            node.status({fill:"green",shape:"dot",text:"ready"});    
        })
        
        this.on('close', async function(removed, done) {
            let node = this
            let rtype = removed ? 'Device was removed/disabled' : 'Device was restarted'
            node.log(`Closing device: ${this.id}, ${rtype}`)
            //Remove Matter.js  Events
            await node.device.events.identify.startIdentifying.off(node.identifyEvt)
            await node.device.events.identify.stopIdentifying.off(node.identifyEvt)
            //Remove Node-RED Custom  Events
            node.removeAllListeners('serverReady')
            await node.device.close()
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
    RED.nodes.registerType("matteroccupancysensor",MatterOccupancySensor)
}