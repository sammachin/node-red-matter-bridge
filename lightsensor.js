const { hasProperty, isNumber } = require('./utils');

module.exports = function(RED) {
    function MatterLightSensor(config) {
        RED.nodes.createNode(this, config);
        var node = this;
        node.bridge = RED.nodes.getNode(config.bridge);
        node.name = config.name
        node.minlevel = config.minlevel 
        node.maxlevel = config.maxlevel
        node.ctx =  this.context().global;
        node.measuredValue = node.ctx.get(node.id+"-measuredValue") || null
        node.bat = config.bat;
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
            switch (msg.topic) {
                case 'state':
                     if (hasProperty(msg, 'payload')) {
                         node.device.set(msg.payload)
                     }
                     if (config.wires.length != 0){
                         msg.payload = node.device.state
                         node.send(msg)
                     } else{
                         node.error((node.device.state));
                     }
                     break;
                 case 'battery':
                     if (node.bat){
                         node.device.set({
                             powerSource: {
                                 batChargeLevel: msg.battery.batChargeLevel
                             }
                         })
                     }
                     break
                default:
                    if (isNumber(msg.payload)){
                        let value
                        if (msg.payload == 0) {
                            value = 0
                        } else {
                            value = Math.floor(10000*Math.log10(msg.payload) +1) // Convert Lux to Measured Value
                        }
                        node.device.set({illuminanceMeasurement: {measuredValue: value }}).catch((err) => {node.debug(err); node.error('Invalid Input')})
                        node.ctx.set(node.id+"-measuredValue",  value)
                        node.measuredValue = value
                    } else {
                        node.error('Invalid input')
                    }
                    
                    break;
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
            //Remove from Bridge Node Registered
            let index = node.bridge.registered.indexOf(node);
            if (index > -1) { 
                node.bridge.registered.splice(index, 1); 
            }
            if (removed){
                await node.device.close()
            }
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
    RED.nodes.registerType("matterlightsensor",MatterLightSensor);
}