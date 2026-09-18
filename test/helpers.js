const { EventEmitter } = require('node:events');

function createNode(modulePath, config = {}) {
    let Constructor;
    const bridge = Object.assign(new EventEmitter(), { serverReady: true, registered: [] });
    const RED = {
        util: { cloneMessage: structuredClone },
        nodes: {
            getNode: () => bridge,
            registerType: (_type, constructor) => { Constructor = constructor; },
            createNode(node) {
                Object.setPrototypeOf(node, EventEmitter.prototype);
                EventEmitter.call(node);
                Object.assign(node, { id: 'test-device', output: [], errors: [], warnings: [] });
                node.log = node.debug = node.status = () => {};
                node.send = msg => node.output.push(structuredClone(msg));
                node.error = (error, msg) => node.errors.push({ error, msg });
                node.warn = message => node.warnings.push(message);
                node.receive = msg => node.emit('input', msg);
                const values = new Map();
                node.context = () => ({ global: values });
            }
        }
    };
    require(modulePath)(RED);
    return new Constructor({ wires: [[]], passthrough: 'true', levelstep: 10, ...config });
}

function observable() {
    const listeners = new Set();
    return {
        on: listener => listeners.add(listener),
        off: listener => listeners.delete(listener),
        emit: (...args) => { for (const listener of listeners) listener(...args); }
    };
}

function fanDevice() {
    const events = {
        identify: { startIdentifying: observable(), stopIdentifying: observable() },
        fanControl: Object.fromEntries(['fanMode', 'percentSetting', 'airflowDirection', 'rockSetting'].map(key => [key + '$Changed', observable()]))
    };
    return {
        state: { fanControl: { fanMode: 1, percentSetting: 20, airflowDirection: 0, rockSetting: { rockLeftRight: false } } },
        events,
        updates: [],
        async set(data) {
            this.updates.push(structuredClone(data));
            const previous = this.state.fanControl;
            this.state.fanControl = { ...previous, ...data.fanControl };
            for (const [key, value] of Object.entries(data.fanControl)) {
                if (JSON.stringify(previous[key]) !== JSON.stringify(value)) {
                    events.fanControl[key + '$Changed'].emit(value, previous[key], { offline: true });
                }
            }
        }
    };
}

const settle = () => new Promise(resolve => setImmediate(resolve));
module.exports = { createNode, observable, fanDevice, settle };
