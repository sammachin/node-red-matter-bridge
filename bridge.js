require("@project-chip/matter-node.js");

const VendorId = require("@project-chip/matter.js/datatype").VendorId;
const Endpoint = require("@project-chip/matter.js/endpoint").Endpoint;
const AggregatorEndpoint = require( "@project-chip/matter.js/endpoints/AggregatorEndpoint").AggregatorEndpoint;
const MatterEnvironment = require("@project-chip/matter.js/environment").Environment;
const ServerNode = require("@project-chip/matter.js/node").ServerNode;
const Logger = require("@project-chip/matter.js/log").Logger;
const os = require('os');
const contactsensor = require("./devices/contactsensor").contactsensor
const colortemplight = require("./devices/colortemplight").colortemplight
const fullcolorlight = require("./devices/fullcolorlight").fullcolorlight;
const dimmablelight = require("./devices/dimmablelight").dimmablelight;
const onoffsocket = require("./devices/onoffsocket").onoffsocket;
const onofflight = require("./devices/onofflight").onofflight;
const lightsensor = require("./devices/lightsensor").lightsensor;
const genericswitch = require("./devices/genericswitch").genericswitch;
const windowcovering = require("./devices/windowcovering").windowcovering;
const humiditysensor = require("./devices/humiditysensor").humiditysensor;
const pressuresensor = require("./devices/pressuresensor").pressuresensor;
const occupancysensor = require("./devices/occupancysensor").occupancysensor;
const temperaturesensor = require("./devices/temperaturesensor").temperaturesensor;



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
                    child.device =  onofflight(child)
                    break
                case 'matteronoffsocket':
                    child.device =  onoffsocket(child)
                    break
                case 'matterdimmablelight':
                    child.device =  dimmablelight(child)
                    break
                case 'matterfullcolorlight':
                    child.device = fullcolorlight(child)
                    break
                case 'mattercolortemplight':
                    child.device = colortemplight(child)
                    break
                case 'mattercontactsensor':
                    child.device = contactsensor(child)
                    break
                case 'matterlightsensor':
                    child.device = lightsensor(child)
                    break
                case 'mattertemperaturesensor':
                    child.device = temperaturesensor(child)
                    break
                case 'matteroccupancysensor':
                    child.device = occupancysensor(child)
                    break
                case 'matterpressuresensor':
                    child.device = pressuresensor(child)
                    break
                case 'matterhumiditysensor':
                    child.device = humiditysensor(child)
                    break
                case 'mattergenericswitch':
                    child.device = genericswitch(child)
                    break
                case 'matterwindowcovering':
                    child.device = windowcovering(child)
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
