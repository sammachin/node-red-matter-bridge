const traverse = require('traverse')

// Matter's BridgedDeviceBasicInformation caps nodeLabel/productName at 32 chars.
// Names longer than this cause the endpoint to fail validation and crash the bridge.
const MAX_NAME_LENGTH = 32

function hasProperty(obj, prop) {
    return obj ? Object.prototype.hasOwnProperty.call(obj, prop) : false
}

// Runtime safety net: truncate a name to the Matter limit so an over-length
// value (e.g. one that slipped past editor validation) can't crash the bridge.
function clampName(name) {
    if (typeof name !== 'string' || name.length <= MAX_NAME_LENGTH) {
        return name
    }
    return name.substring(0, MAX_NAME_LENGTH)
}

function isNumber(value) {
    return typeof value === 'number' && !isNaN(value);
}

function isBoolean(value) {
    return typeof value === 'boolean' && !isNaN(value);
}

function willUpdate(data) {
    var device = this
    if (!device || !device.state) return false
    var changed = false
    traverse(data).map(function (x) {
        if (this.isLeaf) {
            const currVal = this.path.reduce((value, key) => value?.[key], device.state)
            if (currVal != x) {changed = true}
        }
    })
    return changed
}

module.exports = { hasProperty, isNumber, willUpdate, isBoolean, clampName, MAX_NAME_LENGTH };