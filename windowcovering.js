const {logEndpoint, EndpointServer} = require( "@matter/main")


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
            if (msg.topic == 'state'){
                msg.payload = node.device.state
                node.send(msg)
            } else {
                node.pending = true
                node.pendingmsg = msg
                if (msg.payload.liftPosition == undefined) {
                    msg.payload.liftPosition = node.device.state.windowCovering.currentPositionLiftPercent100ths
                }
                if (msg.payload.tiltPosition == undefined) {
                    msg.payload.tiltPosition = node.device.state.windowCovering.currentPositionTiltPercent100ths
                }
                node.device.set({
                    windowCovering: {
                        targetPositionLiftPercent100ths: msg.payload.liftPosition,
                        targetPositionTiltPercent100ths: msg.payload.tiltPosition,
                        currentPositionLiftPercent100ths: msg.payload.liftPosition,
                        currentPositionTiltPercent100ths: msg.payload.tiltPosition
                    }
                })
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
        

       
        node.liftTiltEvt =  function(){
            data = {}
            if (node.lift){
                data.liftPosition = node.device.state.windowCovering.currentPositionLiftPercent100ths
            }
            if (node.tilt){
                data.tiltPosition = node.device.state.windowCovering.currentPositionTiltPercent100ths
            }
            if ((node.pending && node.passthrough)) {
                var msg = node.pendingmsg
                msg.payload=data
                node.send(msg);
            } else if (!node.pending){
                var msg = {payload : {}};
                msg.payload=data
                node.send(msg);
            }
            node.pending = false
        }

        node.liftMovementEvt = function(direction){
            data = {'action' : 'lift', 'direction' : direction}
            if ((node.pending && node.passthrough)) {
                var msg = node.pendingmsg
                msg.payload=data
                node.send(msg);
            } else if (!node.pending){
                var msg = {payload : {}};
                msg.payload=data
                node.send(msg);
            }
            node.pending = false
        }

        node.tiltMovementEvt =  function(direction){
            data = {'action' : 'tilt', 'direction' : direction}
            if ((node.pending && node.passthrough)) {
                var msg = node.pendingmsg
                msg.payload=data
                node.send(msg);
            } else if (!node.pending){
                var msg = {payload : {}};
                msg.payload=data
                node.send(msg);
            }
            node.pending = false
        }

        this.on('close', function(removed, done) {
            this.removeAllListeners('serverReady')
            this.removeAllListeners('identify')
            this.removeAllListeners('liftMovement')
            this.removeAllListeners('tiltMovement')
            this.removeAllListeners('move')

            this.device.close().then(() => {
                done();
            });
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

