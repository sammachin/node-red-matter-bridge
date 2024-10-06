const { BallastConfigurationCluster } = require("@project-chip/matter-node.js/cluster");

const Endpoint  = require("@project-chip/matter.js/endpoint").Endpoint;
const BridgedDeviceBasicInformationServer  = require("@project-chip/matter.js/behavior/definitions/bridged-device-basic-information").BridgedDeviceBasicInformationBehavior;
const WindowCoveringDevice = require("@project-chip/matter.js/devices/WindowCoveringDevice").WindowCoveringDevice
const WindowCoveringServer = require( "@project-chip/matter.js/behavior/definitions/window-covering").WindowCoveringServer
const WindowCovering = require( "@project-chip/matter.js/cluster").WindowCovering; 
const Observable = require("@project-chip/matter.js/util").Observable





class Events extends WindowCoveringServer.Events {
    movementUp = new Observable();
    movementDown = new Observable();
}
WindowCoveringServer.Events = Events

class EventWindowCoveringServer extends WindowCoveringServer {
    async handleMovement(type, reversed, direction, targetPercent100ths) {
        console.log('MovementEvent:', type, reversed, direction)
        if (direction == 0){
            if (reversed){
                this.events.movementDown.emit()
            } else {
                this.events.movementUp.emit()
            }
        }
        if (direction == 1){
            if (reversed){
                this.events.movementUp.emit()
            } else {
                this.events.movementDown.emit()
            }
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
            configStatus : {liftMovementReversed : child.reverseMotor}
        }
        child.tilt === 'pos' ? params.currentPositionTiltPercent100ths = 0 : null
        child.lift === 'pos' ? params.currentPositionLiftPercent100ths = 0 : null

        const device = new Endpoint(WindowCoveringDevice.with(BridgedDeviceBasicInformationServer, EventWindowCoveringServer.with(
             ...features    
            )),{
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
                }
            })

            device.events.identify.startIdentifying.on(() => {
                child.emit('identify', true)
            });
            device.events.identify.stopIdentifying.on(() => {
                child.emit('identify', false)
            });

            if (child.tilt == 'pos'){
                device.events.windowCovering.currentPositionTiltPercent100ths$Changed.on((value) => {child.emit('tilt', value)})
            }

            if (child.lift == 'pos'){
                device.events.windowCovering.currentPositionLiftPercent100ths$Changed.on((value) => {child.emit('lift', value)})
            }

            if (child.tilt == 'tilt'){
                device.events.windowCovering.movementDown.on(() => {child.emit('tiltDown')})
                device.events.windowCovering.movementUp.on(() => {child.emit('tiltUp')})
            }

            if (child.lift == 'lift'){
                device.events.windowCovering.movementDown.on(() => {child.emit('tiltDown')})
                device.events.windowCovering.movementUp.on(() => {child.emit('tiltUp')})
            }   

            return device;
    }
 }