const logEndpoint = require( "@project-chip/matter.js/device").logEndpoint;
const EndpointServer = require("@project-chip/matter.js/endpoint").EndpointServer;


module.exports = function(RED) {
    function MatterDimmableLight(config) {
        RED.nodes.createNode(this,config);
        var node = this;
        node.bridge = RED.nodes.getNode(config.bridge);
        node.name = config.name
        node.range = config.range
        node.pending = false
        node.pendingmsg = null
        node.bat = config.bat
        node.passthrough = /^true$/i.test(config.passthrough)        
        this.log(`Loading Device node ${node.id}`)
        node.status({fill:"red",shape:"ring",text:"not running"});
        this.on('input', function(msg) {
            if (msg.topic == 'state'){
                msg.payload = node.device.state
                node.send(msg)
                logEndpoint(EndpointServer.forEndpoint(node.bridge.matterServer))
            } else {
                node.pending = true
                node.pendingmsg = msg
                if (msg.payload.state == undefined) {
                    msg.payload.state = node.device.state.onOff.onOff
                }
                if (msg.payload.level == undefined) {
                    msg.payload.level = node.device.state.levelControl.currentLevel
                }
                else {
                    if (node.range == "100"){ msg.payload.level = Math.round(msg.payload.level*2.54)}
                }
                node.device.set({
                    levelControl: {
                        currentLevel: msg.payload.level
                    }
                })
                switch (msg.payload.state){
                    case '1':
                    case 1:
                    case 'on':
                    case true:
                        node.device.set({
                            onOff: {
                                onOff: true,
                            }
                        })
                        break
                    case '0':
                    case 0:
                    case 'off':
                    case false:
                        node.device.set({
                            onOff: {
                                onOff: false,
                            }
                        })
                        break
                    case 'toggle':
                        node.device.set({
                            onOff: {
                                        onOff: !node.device.state.onOff.onOff,
                                    }
                        })
                        break
                    
                }}
        });
        this.on('serverReady', function() {
            this.status({fill:"green",shape:"dot",text:"ready"});
        })
        this.on('state', function(data){                        
            if ((node.pending && node.passthrough)) {
                var msg = node.pendingmsg
                msg.payload.state = node.device.state.onOff.onOff
                msg.payload.level = node.device.state.levelControl.currentLevel
                if (node.range == "100"){ msg.payload.level = Math.round(msg.payload.level/2.54)}
                node.send(msg);
            } else if (!node.pending){
                var msg = {payload : {}};
                msg.payload.state = node.device.state.onOff.onOff
                msg.payload.level = node.device.state.levelControl.currentLevel
                if (node.range == "100"){ msg.payload.level = Math.round(msg.payload.level/2.54)}
                node.send(msg);
            }
            node.pending = false
        })
        
        this.on('identify', function(data){
            if (data){
                this.status({fill:"blue",shape:"dot",text:"identify"});
            } else {
                this.status({fill:"green",shape:"dot",text:"ready"});
            }
        });


        this.on('input', function(msg) {
            if (msg.topic == 'state'){
                if (hasProperty(msg, 'payload')) {
                    node.device.set(msg.payload)
                }
                msg.payload = node.device.state
                node.send(msg)
            } else {
                node.pending = true
                node.pendingmsg = msg
                if (hasProperty(msg.payload, 'level') && node.range == "100"){ msg.payload.level = Math.round(msg.payload.level*2.54)}
                if (msg.payload.state == undefined) {
                    msg.payload.state = node.device.state.onOff.onOff
                }
                if (hasProperty(msg.payload, 'increaseLevel')){
                    if (node.range == "100") { 
                        msg.payload.level = node.device.state.levelControl.currentLevel+Math.round(node.levelstep*2.54)
                    } else {
                        msg.payload.level = node.device.state.levelControl.currentLevel+node.levelstep
                    }
                }
                if (hasProperty(msg.payload, 'decreaseLevel')){
                    if (node.range == "100") {
                        msg.payload.level = node.device.state.levelControl.currentLevel-Math.round(node.levelstep*2.54)
                     } else {
                        msg.payload.level = node.device.state.levelControl.currentLevel-node.levelstep
                    }
                }
                if (msg.payload.level == undefined) {
                    msg.payload.level = node.device.state.levelControl.currentLevel
                }
                msg.payload.level=Math.max(2, Math.min(254, msg.payload.level))
                if (msg.payload.state == undefined || typeof(msg.payload) != "object"){
                    msg.payload = state = {state: msg.payload}
                }
                if (typeof msg.payload.state != "boolean") {
                    switch (msg.payload.state){
                        case '1':
                        case 1:
                        case 'on':
                            msg.payload.state = true
                            break
                        case '0':
                        case 0:
                        case 'off':
                            msg.payload.state = false
                            break
                        case 'toggle':
                            msg.payload.state = !node.device.state.onOff.onOff
                            break
                    }
                }
                let newData = {
                    onOff: {
                        onOff: msg.payload.state,
                    },
                    levelControl: {
                        currentLevel: msg.payload.level
                    }
                }
                //If values are changed then set them & wait for callback otherwise send msg on
                if (willUpdate.call(node.device, newData)) {
                    node.debug(`WILL update, ${newData}`)
                    node.pending = true
                    node.pendingmsg = msg
                    node.device.set(newData)
                } else {
                    node.debug(`WONT update, ${newData}`)
                    if (node.passthrough){
                        node.send(msg);
                    }
                }
            }
        });


        this.on('serverReady', function() {
        var node = this
        node.device.events.onOff.onOff$Changed.on(node.stateEvt) 
        node.device.events.levelControl.currentLevel$Changed.on(node.stateEvt) 
        node.device.events.identify.startIdentifying.on(node.identifyEvt)
        node.device.events.identify.stopIdentifying.on(node.identifyEvt)
        node.status({fill:"green",shape:"dot",text:"ready"});    
        })

        this.on('close', function(removed, done) {
            this.off('state')
            this.off('serverReady')
            this.off('identify')
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
    RED.nodes.registerType("matterdimmablelight",MatterDimmableLight);
}