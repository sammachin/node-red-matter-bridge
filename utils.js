const traverse = require('traverse')

function hasProperty(obj, prop) {
    return obj ? Object.prototype.hasOwnProperty.call(obj, prop) : false
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

module.exports = { hasProperty, isNumber, willUpdate, isBoolean };