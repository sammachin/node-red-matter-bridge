const {Endpoint, Observable}  = require("@matter/main");
const {BridgedDeviceBasicInformationServer, PowerSourceServer}  = require("@matter/main/behaviors");

const {WindowCoveringDevice} = require("@matter/main/devices")
const {WindowCoveringServer} = require( "@matter/main/behaviors")
const {WindowCovering} = require( "@matter/main/clusters")
const  {PowerSource}  = require( "@matter/main/clusters")

class Events extends WindowCoveringServer.Events {
    liftMovement = new Observable();
    tiltMovement = new Observable();

}
WindowCoveringServer.Events = Events

class EventWindowCoveringServer extends WindowCoveringServer {
    async handleMovement(type, reversed, direction, targetPercent100ths) {
        let d
        if (reversed) {
            d = direction ^ 1 ? 'down' : 'up' // xor with 1 to invert direction, up is 0 down is 1
        } else {
            d = direction ? 'down' : 'up' // up is 0 down is 1
        }
        if (!targetPercent100ths) {
            targetPercent100ths = direction * 10000
        }
        switch (type) {
            case 0: //lift
                this.events.liftMovement.emit(d)
                break;
            case 1: //tilt
                this.events.tiltMovement.emit(d)
                break;
        }
        // Updates the position
        await super.handleMovement(type, reversed, direction, targetPercent100ths);
    }
}



module.exports = {
    windowcovering: function(child) {
        let features = []
        if (child.lift) {
            features.push(WindowCovering.Feature.Lift)
        }
        if (child.lift == 'pos'){
            features.push(WindowCovering.Feature.PositionAwareLift)
        }
        if (child.tilt) {
            features.push(WindowCovering.Feature.Tilt)
        }
        if (child.tilt == 'pos'){
            features.push(WindowCovering.Feature.PositionAwareTilt)
        } 
        let params = {
            type: child.coveringType,
            endProductType: child.productType,
            configStatus : {liftMovementReversed : child.reversed}
        }
        child.tilt === 'pos' ? params.currentPositionTiltPercent100ths = 0 : null
        child.lift === 'pos' ? params.currentPositionLiftPercent100ths = 0 : null

        const device = new Endpoint(WindowCoveringDevice.with(BridgedDeviceBasicInformationServer, EventWindowCoveringServer.with(
             ...features    
            ), ... child.bat? [PowerSourceServer.with(PowerSource.Feature.Battery, PowerSource.Feature.Rechargeable)]: []), {
                id: child.id,
                bridgedDeviceBasicInformation: {
                    nodeLabel: child.name,
                    productName: child.name,
                    productLabel: child.name,
                    serialNumber: child.id,
                    reachable: true,
                },
                windowCovering: {
                    ...params
                },
                ... child.bat? {powerSource: {
                    status: PowerSource.PowerSourceStatus.Active,
                    order: 1,
                    description: "Battery",
                    batFunctionalWhileCharging: true,
                    batChargeLevel: PowerSource.BatChargeLevel.Ok,
                    batChargeState: PowerSource.BatChargeState.Unknown,
                    batReplacementNeeded: false,
                    batReplaceability: PowerSource.BatReplaceability.Unspecified,
                }}: {}
            })
            return device;
    }
 }