const traverse = require('traverse')

function hasProperty(obj, prop) {
    return obj ? Object.prototype.hasOwnProperty.call(obj, prop) : false
}

function isNumber(value) {
    return typeof value === 'number' && !isNaN(value);
}

function willUpdate(data) {
    var device = this
    var changed = false
    traverse(data).map(function (x) {
        if (this.isLeaf) {
            let path = this.path.join(".")
            let currVal = eval('device.state.'+path)
            if (currVal != x) {changed = true}
        }
    })
    return changed
}

module.exports = { hasProperty, isNumber, willUpdate };