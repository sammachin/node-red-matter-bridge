const { hasProperty} = require('./utils');
const  {PowerSource}  = require( "@matter/main/clusters")


function battery(node, msg) {
    if (hasProperty(msg.battery, 'level')){
        switch (msg.battery.level) {
            case 'ok':
            case '0':
            case 0:
                node.device.set({powerSource: {batChargeLevel: 0}})
            break;
            case 'low':
            case 'warning':
            case '1':
            case 1:
                node.device.set({powerSource: {batChargeLevel: 1}})
            break;
            case 'critical':
            case '2':
            case 2:
                node.device.set({powerSource: {batChargeLevel: 2}})
            break;
        }    
    }
    if (hasProperty(msg.battery, 'percent')){
        node.device.set({powerSource: {batPercentRemaining: Number(msg.battery.percent)*2}})
    }    
    if (hasProperty(msg.battery, 'charge' ) && node.bat == 'recharge'){
        switch (msg.battery.charge) {
            case 'unknown':
            case '0':
            case 0:
                node.device.set({powerSource: {batChargeState: 0}})
            break;
            case 'charging':
            case '1':
            case 1:
                node.device.set({powerSource: {batChargeState: 1}})
            break;
            case 'full':
            case '2':
            case 2:
                node.device.set({powerSource: {batChargeState: 2}})
            break;
            case 'notcharging':
            case '3':
            case 3:
                node.device.set({powerSource: {batChargeState: 3}})
            break;
        }    
     } else if (hasProperty(msg.battery, 'charge' ) && node.bat != 'recharge'){
        node.error("Can't set charging state on non-rechargable battery")
     }
    msg.payload = 'ok'
    node.send(msg)
}

function batFeatures(node) {
    switch (node.bat) {
        case 'recharge':
            features =  {
                status: PowerSource.PowerSourceStatus.Active,
                order: 1,
                description: "Battery",
                batChargeLevel: PowerSource.BatChargeLevel.Ok,
                batReplacementNeeded: false,
                batReplaceability: PowerSource.BatReplaceability.Unspecified,
                batChargeState: PowerSource.BatChargeState.Unknown,
                batFunctionalWhileCharging: true,
                batQuantity: 1
            }
            break;
        case 'replace':
            features =  {
                status: PowerSource.PowerSourceStatus.Active,
                order: 1,
                description: "Battery",
                batChargeLevel: PowerSource.BatChargeLevel.Ok,
                batReplacementNeeded: false,
                batReplaceability: PowerSource.BatReplaceability.UserReplaceable,
                batReplacementDescription: "",
                batQuantity: 1
            }
            break;
    }
    return features
    
}

module.exports = { battery, batFeatures };



