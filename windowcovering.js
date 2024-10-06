
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
        console.log(`Loading Device node ${node.id}`)
        node.status({fill:"red",shape:"ring",text:"not running"});
        node.pending = false
        this.on('input', function(msg) {
            node.pending = true
            node.pendingmsg = msg
            console.log(msg)
            console.log(node.device.state.windowCovering)

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
            if ((node.pending && node.passthrough)) {
                var msg = node.pendingmsg
                msg.payload.state=data
                node.send(msg);
            } else if (!node.pending){
                var msg = {payload : {}};
                msg.payload=data
                node.send(msg);
            }
            node.pending = false
            console.log(data)
        })
        this.on('tilt', function(){
            data = {'liftPositon' : node.device.state.windowCovering.currentPositionLiftPercent100ths, 'tiltPositon' : node.device.state.windowCovering.currentPositionTiltPercent100ths}
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
        this.on('moveUp', function(){
            switch (action){
                case 'tilt':
                    data = {'action' : 'tilt', 'direction' : null}
                    switch (node.device.state.windowCovering.operationalStatus.tilt) {
                        case 1:
                            data.direction = 'open'
                            break;
                        case 2:
                            data.direction = 'close'
                            break;
                        default:
                            break;
                    }
                break;
                case 'lift':
                    data = {'action' : 'lift', 'direction' : null}
                    switch (node.device.state.windowCovering.operationalStatus.lift) {
                        case 1:
                            data.direction = 'open'
                            break;
                        case 2:
                            data.direction = 'close'
                            break;
                        default:
                            break;
                    }
                break;
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
        })

        this.on('close', function(removed, done) {
            this.removeAllListeners('serverReady')
            this.removeAllListeners('identify')
            this.removeAllListeners('lift')
            this.removeAllListeners('tilt')
            this.removeAllListeners('move')

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
    RED.nodes.registerType("matterwindowcovering",MatterWindowCovering)
}

