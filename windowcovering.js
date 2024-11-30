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
            this.status({fill:"green",shape:"dot",text:"ready"});

        })
        
        this.on('identify', function(data){
            if (data){
                this.status({fill:"blue",shape:"dot",text:"identify"});
            } else {
                this.status({fill:"green",shape:"dot",text:"ready"});
            }
            
        })

        this.on('lift', function(){
            data = {'liftPositon' : node.device.state.windowCovering.currentPositionLiftPercent100ths, 'tiltPositon' : node.device.state.windowCovering.currentPositionTiltPercent100ths}
            //data = {}
            //data.liftPositon = node.device.state.windowCovering.currentPositionLiftPercent100ths
            if ((node.pending && node.passthrough)) {
                var msg = node.pendingmsg
                msg.payload = data
                node.send(msg);
            } else if (!node.pending){
                var msg = {payload : {}};
                msg.payload=data
                node.send(msg);
            }
            node.pending = false
        })
        this.on('tilt', function(){
            data = {}
            data.tiltPositon = node.device.state.windowCovering.currentPositionTiltPercent100ths
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
        })
        this.on('liftMovement', function(direction){
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
        })
        this.on('tiltMovement', function(direction){
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
        })

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

