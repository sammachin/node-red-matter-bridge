function hasProperty(obj, prop) {
    return obj ? Object.prototype.hasOwnProperty.call(obj, prop) : false
}

function isNumber(value) {
    return typeof value === 'number' && !isNaN(value);
}

module.exports = { hasProperty, isNumber };