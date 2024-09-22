require("@project-chip/matter-node.js");
const  BridgedDeviceBasicInformationServer  = require("@project-chip/matter.js/behavior/definitions/bridged-device-basic-information").BridgedDeviceBasicInformationBehavior;
const  VendorId  = require("@project-chip/matter.js/datatype").VendorId;
const  OnOffLightDevice  = require("@project-chip/matter.js/devices/OnOffLightDevice").OnOffLightDevice;
const  OnOffPlugInUnitDevice = require( "@project-chip/matter.js/devices/OnOffPlugInUnitDevice").OnOffPlugInUnitDevice;
const  ExtendedColorLightDevice = require( "@project-chip/matter.js/devices/ExtendedColorLightDevice").ExtendedColorLightDevice;
const  DimmableLightDevice   = require("@project-chip/matter.js/devices/DimmableLightDevice").DimmableLightDevice
const  ColorControlServer = require( "@project-chip/matter.js/behavior/definitions/color-control").ColorControlServer
const  ColorControl  = require( "@project-chip/matter.js/cluster").ColorControl
const  Endpoint  = require("@project-chip/matter.js/endpoint").Endpoint;
const  AggregatorEndpoint  = require( "@project-chip/matter.js/endpoints/AggregatorEndpoint").AggregatorEndpoint;
const  MatterEnvironment   = require("@project-chip/matter.js/environment").Environment;
const  ServerNode  = require("@project-chip/matter.js/node").ServerNode;
const  Logger  = require("@project-chip/matter.js/log").Logger; 
const os = require('os')

function genPasscode(){
    let x = Math.floor(Math.random() * (99999998-1) +1)
    invalid = [11111111,22222222,33333333,44444444,55555555,66666666,77777777,88888888,12345678,87654321]
    if (invalid.includes(x)){
        x += 1
    }
    let xx =  x.toString().padStart(8, '0')
    return +xx
}

module.exports =  function(RED) {
    function MatterBridge(config) {
        RED.nodes.createNode(this, config);
        var node = this;
        if (node.restart){
            console.log('Bridge Node Restarted')
        }
        node.restart = false
        switch (config.logLevel) {
            case "FATAL":
                Logger.defaultLogLevel = 5;
                break;
            case "ERROR":
                Logger.defaultLogLevel = 4;
                break;
            case "WARN":
                Logger.defaultLogLevel = 3;
                break;
            case "INFO":
                Logger.defaultLogLevel = 1;
                break;1
            case "DEBUG":
                Logger.defaultLogLevel = 0;
                break;
        }
        console.log(`Loading Bridge node ${node.id}`)
        //Params
        node.users = config._users
        node.name = config.name
        node.vendorId = +config.vendorId
        node.productId = +config.productId
        node.vendorName = config.vendorName
        node.productName = config.productName
        node.networkInterface = config.networkInterface 
        node.port = 5540
        node.passcode = genPasscode()
        node.discriminator = +Math.floor(Math.random() * 4095).toString().padStart(4, '0')
        //Storage TODO: Refactor to use node-red node storage
        //node.storage= new Storage.StorageBackendDisk("storage-"+node.id)
        //const storageManager = new Storage.StorageManager(node.storage);
        //storageManager.initialize().then(() => {
        //    node.deviceStorage = storageManager.createContext("Device")

        node.serverReady = false;
        MatterEnvironment.default.vars.set('mdns.networkInterface', node.networkInterface);
        //Servers
        ServerNode.create({
            id: node.id,
            network: {
                port: node.port,
            },
            commissioning: {
                passcode: node.passcode,
                discriminator :  node.discriminator
            },
            productDescription: {
                name: node.name,
                deviceType: AggregatorEndpoint.deviceType,
            },
            basicInformation: {
                vendorName : 'Node-RED Matter Bridge',
                vendorId: VendorId(node.vendorId),
                nodeLabel: node.name,
                productName: node.name,
                productLabel: node.name,
                productId: node.productId,
                serialNumber: `noderedmatter-${node.id}`,
                uniqueId : node.id
            },
        })
        .then((matterServer) =>{
            node.aggregator = new Endpoint(AggregatorEndpoint, { id: "aggregator" });
            node.matterServer = matterServer
            node.matterServer.add(node.aggregator);
            console.log("Bridge Created, awaiting child nodes")
            console.log('Server Ready')
            node.serverReady = true
        })
        console.log('Trying')
        if (node.users.length == 0 && node.serverReady){
            console.log('Starting Bridge')
            node.matterServer.start();
            node.registered.forEach(x => {
                x.emit('serverReady')
            });
        } else {
            console.log('Not Starting yet, more devices to load')
        }

        

        node.registered = []

        this.on('registerChild', function(child){
            console.log(`Registering ${child.id} with ${node.id}`)
            node.registered.push(child)
            const index = node.users.indexOf(child.id);
            if (index > -1) { 
                node.users.splice(index, 1); 
            }
            switch (child.type){
                case 'matteronofflight':
                    child.device =  new Endpoint(
                        OnOffLightDevice.with(BridgedDeviceBasicInformationServer),
                        {
                            id: child.id,
                            bridgedDeviceBasicInformation: {
                                nodeLabel: child.name,
                                productName: child.name,
                                productLabel: child.name,
                                serialNumber: child.id,
                                reachable: true,
                            },
                    });
                    child.device.events.onOff.onOff$Changed.on(value => {
                        child.emit('state', value)
                    });
                    child.device.events.identify.startIdentifying.on(() => {
                        child.emit('identify', true)
                    });
                    child.device.events.identify.stopIdentifying.on(() => {
                        child.emit('identify', false)
                    });
                    break
                case 'matteronoffsocket':
                    child.device =  new Endpoint(
                        OnOffPlugInUnitDevice.with(BridgedDeviceBasicInformationServer),
                        {
                            id: child.id,
                            bridgedDeviceBasicInformation: {
                                nodeLabel: child.name,
                                productName: child.name,
                                productLabel: child.name,
                                serialNumber: child.id,
                                reachable: true,
                            },
                    });
                    child.device.events.onOff.onOff$Changed.on(value => {
                        child.emit('state', value)
                    });
                    child.device.events.identify.startIdentifying.on(() => {
                        child.emit('identify', true)
                    });
                    child.device.events.identify.stopIdentifying.on(() => {
                        child.emit('identify', false)
                    });
                    break
                case 'matterdimmablelight':
                    child.device =  new Endpoint(
                        DimmableLightDevice.with(BridgedDeviceBasicInformationServer),
                        {
                            id: child.id,
                            bridgedDeviceBasicInformation: {
                                nodeLabel: child.name,
                                productName: child.name,
                                productLabel: child.name,
                                serialNumber: child.id,
                                reachable: true,
                            },
                    });
                    child.device.events.onOff.onOff$Changed.on(value => {
                        child.emit('state', value)
                    });
                    child.device.events.levelControl.currentLevel$Changed.on(value => {
                        child.emit('state', value)
                    })
                    child.device.events.identify.startIdentifying.on(() => {
                        child.emit('identify', true)
                    });
                    child.device.events.identify.stopIdentifying.on(() => {
                        child.emit('identify', false)
                    });
                    break
                case 'matterfullcolorlight':
                    child.device =  new Endpoint(
                        ExtendedColorLightDevice.with(BridgedDeviceBasicInformationServer, ColorControlServer.with(
                            ColorControl.Feature.HueSaturation,
                            ColorControl.Feature.Xy,
                            ColorControl.Feature.ColorTemperature,
                        )),{
                            id: child.id,
                            bridgedDeviceBasicInformation: {
                                nodeLabel: child.name,
                                productName: child.name,
                                productLabel: child.name,
                                serialNumber: child.id,
                                reachable: true,
                            },
                            colorControl: {
                                coupleColorTempToLevelMinMireds: 0x00FA,
                                startUpColorTemperatureMireds: 0x00FA,
                                colorMode: 0
                            }
                        }
                        )
                        child.device.events.onOff.onOff$Changed.on(value => {
                            child.emit('state', value)
                        });
                        child.device.events.levelControl.currentLevel$Changed.on(value => {
                            let data = {level: value}
                            child.emit('state', data)
                        })
                        child.device.events.identify.startIdentifying.on(() => {
                            child.emit('identify', true)
                        });
                        child.device.events.identify.stopIdentifying.on(() => {
                            child.emit('identify', false)
                        });
                        child.device.events.colorControl.currentHue$Changed.on(value => {
                            let data = {hue: value}
                            child.emit('state', data)
                        });
                        child.device.events.colorControl.currentSaturation$Changed.on(value => {
                            let data = {sat: value}
                            child.emit('state', data)
                        });
                        child.device.events.colorControl.colorTemperatureMireds$Changed.on(value => {
                            let data = {temp: value}
                            child.emit('state', data)
                        });
                        break
            }
 
            console.log("adding device to aggregator")
            node.aggregator.add(child.device);
            console.log('Trying')
            if (node.users.length == 0 && node.serverReady){
                console.log('Starting Bridge')
                node.matterServer.start();
                node.registered.forEach(x => {
                    x.emit('serverReady')
                });
            } else {
                console.log('Not Starting yet, , more devices to load')
            }
        })

        this.on('close', function(removed, done) {
            if (removed) {
                console.log("Bridge Removed")
                node.matterServer.close()
            } else {
                console.log("Bridge Restarted")
                node.restart = true
                node.matterServer.close()
            }
            done();
        });
    }

    RED.nodes.registerType("matterbridge",MatterBridge);

    RED.httpAdmin.get('/_matterbridge/commisioning/:id', RED.auth.needsPermission('admin.write'), function(req,res){
        let target_node = RED.nodes.getNode(req.params.id)
        if (target_node){
            if (!target_node.matterServer.lifecycle.isCommissioned) {
                const pairingData = target_node.matterServer.state.commissioning.pairingCodes;
                const { qrPairingCode, manualPairingCode } = pairingData;
                response = {state : 'ready', qrPairingCode : qrPairingCode, manualPairingCode: manualPairingCode}
            }
            else {
                response = {state : 'commissioned'}
            }
            res.send(response);
        } else {
            res.sendStatus(404);      
        }
    })

    RED.httpAdmin.get('/_matterbridge/interfaces', RED.auth.needsPermission('admin.write'), function(req,res){
        let interfaces = Object.keys(os.networkInterfaces())
        res.send(interfaces)
    })
}
