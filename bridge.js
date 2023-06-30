const Matter = require("@project-chip/matter-node.js");
const Device = require("@project-chip/matter-node.js/device"); 
const DataType = require("@project-chip/matter-node.js/datatype"); 
const Log = require("@project-chip/matter-node.js/log"); 
const Storage = require("@project-chip/matter-node.js/storage"); 
const Cluster = require("@project-chip/matter.js/cluster")
const Interaction = require("@project-chip/matter.js/interaction")


function genPasscode(){
    let x = Math.floor(Math.random() * (99999998-1) +1)
    invalid = [11111111,22222222,33333333,44444444,55555555,66666666,77777777,88888888,12345678,87654321]
    if (invalid.includes(x)){
        x += 1
    }
    return x.toString().padStart(8, '0')
}

module.exports = function(RED) {
    function MatterBridge(config) {
        RED.nodes.createNode(this, config);
        var node = this;
        console.log(`Loading Bridge node ${node.id}`)
        //Params
        node.users = config._users
        node.name = config.name
        node.vendorId = new DataType.VendorId(+config.vendorId)
        node.productId = +config.productId
        node.vendorName = config.vendorName
        node.productName = config.productName
        node.networkInterface = config.networkInterface
        node.port = 5540
        node.passcode = genPasscode()
        node.discriminator = Math.floor(Math.random() * 4095).toString().padStart(4, '0')
        node.deviceType = Device.DeviceTypes.AGGREGATOR.code;
        //Storage TODO: Refactor to use nodes storage
        node.storage= new Storage.StorageBackendDisk("storage-"+node.id)
        const storageManager = new Storage.StorageManager(node.storage);
        storageManager.initialize().then(() => {
            node.deviceStorage = storageManager.createContext("Device")
        })
        //Servers
        node.matterServer = new Matter.MatterServer(storageManager, node.networkInterface);
        node.commissioningServer = new Matter.CommissioningServer({
            port : node.port,
            deviceName : node.name,
            deviceType : node.deviceType,
            passcode : node.passcode,
            discriminator : node.discriminator,
            basicInformation: {
                vendorName : node.vendorName,
                vendorId: node.vendorId,
                productName: node.productName,
                productId: node.productId,
                serialNumber: `node-matter-${node.id}`
            }
        });
        node.commissioningServer.addRootClusterServer((0, Interaction.ClusterServer)(Cluster.BridgedDeviceBasicInformationCluster, {
            nodeLabel: node.name,
            serialNumber: `node-matter-${node.id}`,
            reachable: true
        }, {}));

        const aggregator = new Device.Aggregator();

        node.registered = []
        console.log("Bridge Created, awaiting child nodes")

        this.on('registerChild', function(child){
            console.log(`Registering ${child.id} with ${node.id}`)
            node.registered.push(child)
            const index = node.users.indexOf(child.id);
            if (index > -1) { 
                node.users.splice(index, 1); 
            }
            switch (child.type){
                case 'matteronofflight':
                    child.device =  new Device.OnOffLightDevice();
                    child.device.addOnOffListener(on => { 
                        child.emit('state', on)
                    });
                    break
                case 'matteronoffsocket':
                    child.device =  new Device.OnOffPluginUnitDevice();
                    child.device.addOnOffListener(on => { 
                        child.emit('state', on)
                    });
                    break
            }
            
            aggregator.addBridgedDevice(child.device, {
                nodeLabel: child.name,
                serialNumber: `node-matter-${child.id}`,
                reachable: true
            });
            if (node.users.length == 0){
                node.commissioningServer.addDevice(aggregator);
                node.matterServer.addCommissioningServer(node.commissioningServer);
                node.matterServer.start();
                node.registered.forEach(x => {
                    console.log(x.id)
                    x.emit('serverReady')
                });
            }
        })




        this.on('close', function(removed, done) {
            if (removed) {
                console.log("Bridge Removed")
                node.matterServer.stop()
            } else {
                console.log("Bridge Restarted")
                node.matterServer.stop()
            }
            done();
        });
    }
    RED.nodes.registerType("matterbridge",MatterBridge);

    RED.httpAdmin.get('/_matterbridge/commisioning/:id', RED.auth.needsPermission('admin.write'), function(req,res){
        let target_node = RED.nodes.getNode(req.params.id)
        if (target_node){
            if (!target_node.commissioningServer.isCommissioned()) {
                const pairingData = target_node.commissioningServer.getPairingCode();
                const { qrCode, qrPairingCode, manualPairingCode } = pairingData;
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
}
