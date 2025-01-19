const {logEndpoint, EndpointServer} = require( "@matter/main")
const { hasProperty, willUpdate } = require('./utils');
const {battery} = require('./battery')


module.exports = function(RED) {
    function MatterWindowCovering(config) {
        RED.nodes.createNode(this,config);
        var node = this;
        node.bridge = RED.nodes.getNode(config.bridge);
        node.name = config.name
        node.tilt = config.tilt
        node.lift = config.lift
        node.productType = Number(config.productType)
        node.coveringType = Number(config.coveringType)
        node.reversed = config.reversed
        this.log(`Loading Device node ${node.id}`)
        node.status({fill:"red",shape:"ring",text:"not running"});
        node.pending = false
        node.passthrough = /^true$/i.test(config.passthrough)
        node.bat = config.bat;
        node.topic = config.topic || false
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
            this.log(msg.payload)
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
                        battery(node, msg)
                    }
                break
                default:
                    if (msg.payload.liftPosition == undefined) {
                        msg.payload.liftPosition = node.device.state.windowCovering.currentPositionLiftPercent100ths
                    }
                    if (msg.payload.tiltPosition == undefined) {
                        msg.payload.tiltPosition = node.device.state.windowCovering.currentPositionTiltPercent100ths
                    }
                    let newData = {
                        windowCovering: {
                            targetPositionLiftPercent100ths: msg.payload.liftPosition,
                            targetPositionTiltPercent100ths: msg.payload.tiltPosition,
                            currentPositionLiftPercent100ths: msg.payload.liftPosition,
                            currentPositionTiltPercent100ths: msg.payload.tiltPosition
                        }
                    }
                    //If values are changed then set them & wait for callback otherwise send msg on
                    if (willUpdate.call(node.device, newData)) {
                        node.debug(`WILL update, ${newData}`)
                        node.pending = true
                        node.pendingmsg = msg
                        node.device.set(newData).catch((err) => {node.debug(err); node.error('Invalid Input')})
                    } else {
                        node.debug(`WONT update, ${newData}`)
                        if (node.passthrough){
                            node.send(msg);
                        }
                    }
                    break
            }
            

        });
        
        this.on('serverReady', function() {
            var node = this
            node.device.events.identify.startIdentifying.on(node.identifyEvt)
            node.device.events.identify.stopIdentifying.on(node.identifyEvt)
            if (node.tilt == 'pos'){
                node.device.events.windowCovering.currentPositionTiltPercent100ths$Changed.on(node.liftTiltEvt)
            }
            if (node.lift == 'pos'){
                node.device.events.windowCovering.currentPositionLiftPercent100ths$Changed.on(node.liftTiltEvt)
            }
            if (node.tilt == 'tilt'){
                node.device.events.windowCovering.tiltMovement.on(node.tiltMovementEvt)
            }
            if (node.tilt == 'lift'){
                node.device.events.windowCovering.liftMovement.on(node.liftMovementEvt)
            }
            node.status({fill:"green",shape:"dot",text:"ready"});    
        })
        

       
        node.liftTiltEvt =  function(value, oldValue, context) {
            let eventSource = {}
            if (hasProperty(context, 'offline')) {
                eventSource.local = true
            } else {
                eventSource.local = false
                eventSource.srcAddress = context.exchange.channel.channel.peerAddress
                eventSource.srcPort = context.exchange.channel.channel.peerPort
                eventSource.fabric = node.bridge.matterServer.state.commissioning.fabrics[context.fabric]
            }
            data = {}
            if (node.lift){
                data.liftPosition = node.device.state.windowCovering.currentPositionLiftPercent100ths
            }
            if (node.tilt){
                data.tiltPosition = node.device.state.windowCovering.currentPositionTiltPercent100ths
            }
            if ((node.pending && node.passthrough)) {
                var msg = node.pendingmsg
                msg.eventSource = eventSource
                msg.payload=data
                node.send(msg);
            } else if (!node.pending){
                var msg = {payload : {}};
                if (node.topic) {msg.topic = node.topic}
                msg.eventSource = eventSource
                msg.payload=data
                node.send(msg);
            }
            node.pending = false
        }

        node.liftMovementEvt = function(direction, context) {
            let eventSource = {}
            //if (hasProperty(context, 'offline')) {
            //    eventSource.local = true
            //} else {
            //    eventSource.local = false
            //    eventSource.srcAddress = context.exchange.channel.channel.peerAddress
            //    eventSource.srcPort = context.exchange.channel.channel.peerPort
            //    eventSource.fabric = node.bridge.matterServer.state.commissioning.fabrics[context.fabric]
            //}
            data = {'action' : 'lift', 'direction' : direction}
            if ((node.pending && node.passthrough)) {
                var msg = node.pendingmsg
                //msg.eventSource = eventSource
                msg.payload=data
                node.send(msg);
            } else if (!node.pending){
                var msg = {payload : {}};
                if (node.topic) {msg.topic = node.topic}
                //msg.eventSource = eventSource
                msg.payload=data
                node.send(msg);
            }
            node.pending = false
        }

        node.tiltMovementEvt =  function(direction, context) {
            let eventSource = {}
            //if (hasProperty(context, 'offline')) {
            //    eventSource.local = true
            //} else {
            //    eventSource.local = false
            //    eventSource.srcAddress = context.exchange.channel.channel.peerAddress
            //    eventSource.srcPort = context.exchange.channel.channel.peerPort
            //    eventSource.fabric = node.bridge.matterServer.state.commissioning.fabrics[context.fabric]
            //}
            data = {'action' : 'tilt', 'direction' : direction}
            if ((node.pending && node.passthrough)) {
                var msg = node.pendingmsg
                msg.eventSource = eventSource
                msg.payload=data
                node.send(msg);
            } else if (!node.pending){
                var msg = {payload : {}};
                if (node.topic) {msg.topic = node.topic}
                msg.eventSource = eventSource
                msg.payload=data
                node.send(msg);
            }
            node.pending = false
        }

        this.on('close', async function(removed, done) {
            let node = this
            let rtype = removed ? 'Device was removed/disabled' : 'Device was restarted'
            node.log(`Closing device: ${this.id}, ${rtype}`)
            //Remove Matter.js Events
            await node.device.events.identify.startIdentifying.off(node.identifyEvt)
            await node.device.events.identify.stopIdentifying.off(node.identifyEvt)
            if (node.tilt == 'pos'){
                await node.device.events.windowCovering.currentPositionTiltPercent100ths$Changed.off(node.liftTiltEvt)
            }
            if (node.lift == 'pos'){
                await node.device.events.windowCovering.currentPositionLiftPercent100ths$Changed.off(node.liftTiltEvt)
            }
            if (node.tilt == 'tilt'){
                await node.device.events.windowCovering.tiltMovement.off(node.tiltMovementEvt)
            }
            if (node.tilt == 'lift'){
                await node.device.events.windowCovering.liftMovement.off(node.liftMovementEvt)
            }
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
    RED.nodes.registerType("matterwindowcovering",MatterWindowCovering)
}

