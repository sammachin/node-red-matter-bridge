const { hasProperty } = require('./utils');

function clamp(node, field, value, min, max, unit) {
    const clamped = Math.min(max, Math.max(min, value));
    if (clamped !== value) {
        node.warn(`Clamped ${field} from ${value} to ${clamped} ${unit} (allowed ${min}–${max}).`);
    }
    return clamped;
}

function temperatureOutput(node, mireds = node.device.state.colorControl.colorTemperatureMireds) {
    return node.tempformat === 'kelvin' ? Math.floor(1000000 / mireds) : mireds;
}

// Normalize the public light payload before updating Matter or forwarding an unchanged input.
// The raw "state" topic deliberately continues to use Matter's own attribute validation.
function lightInput(node, msg, kind) {
    const payload = msg.payload;
    if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
        node.error('Light payload must be an object.', msg);
        return;
    }
    const fields = ['level'];
    if (kind !== 'dimmable') fields.push('temp');
    if (kind === 'fullcolor') fields.push('hue', 'sat');
    for (const field of fields) {
        if (hasProperty(payload, field) && !Number.isFinite(payload[field])) {
            node.error(`payload.${field} must be a finite number.`, msg);
            return;
        }
    }
    if (kind === 'fullcolor' && hasProperty(payload, 'temp') &&
        (hasProperty(payload, 'hue') || hasProperty(payload, 'sat'))) {
        node.error("Can't set Colour Temp and Hue/Sat at same time", msg);
        return;
    }

    const state = node.device.state;
    const percent = String(node.range) === '100';
    const scale = percent ? 2.54 : 1;
    const minLevel = state.levelControl.minLevel ?? 1;
    const maxLevel = state.levelControl.maxLevel ?? 254;
    let level = hasProperty(payload, 'level') ? payload.level : (state.levelControl.currentLevel ?? minLevel) / scale;
    if (hasProperty(payload, 'increaseLevel') || hasProperty(payload, 'decreaseLevel')) {
        if (!Number.isFinite(node.levelstep)) {
            node.error('Level Step must be a finite number.', msg);
            return;
        }
        const step = Math.round(node.levelstep * scale);
        level = ((state.levelControl.currentLevel ?? minLevel) +
            (hasProperty(payload, 'decreaseLevel') ? -step : step)) / scale;
    }
    const unit = percent ? '%' : '(0–254 scale)';
    level = Math.round(clamp(node, 'payload.level', level,
        Math.max(1, minLevel / scale), maxLevel / scale, unit) * scale);
    payload.level = level;
    const result = { level };
    if (kind === 'dimmable') return result;

    const color = state.colorControl;
    if (kind === 'fullcolor' && (hasProperty(payload, 'hue') || hasProperty(payload, 'sat'))) {
        payload.hue = Math.round(clamp(node, 'payload.hue', payload.hue ?? color.currentHue ?? 0, 0, 254, '(0–254 scale)'));
        payload.sat = Math.round(clamp(node, 'payload.sat', payload.sat ?? color.currentSaturation ?? 0, 0, 254, '(0–254 scale)'));
        result.color = { colorMode: 0, currentHue: payload.hue, currentSaturation: payload.sat };
    } else if (hasProperty(payload, 'temp')) {
        const min = Math.max(1, color.colorTempPhysicalMinMireds || 1);
        const max = color.colorTempPhysicalMaxMireds || 0xFEFF;
        const kelvin = node.tempformat === 'kelvin';
        const temperature = clamp(node, 'payload.temp', payload.temp,
            kelvin ? 1000000 / max : min, kelvin ? 1000000 / min : max,
            kelvin ? 'K' : 'mireds');
        const mireds = Math.round(kelvin ? 1000000 / temperature : temperature);
        result.color = { colorMode: 2, colorTemperatureMireds: mireds };
        payload.temp = temperatureOutput(node, mireds);
    } else {
        result.color = kind === 'fullcolor' ? { colorMode: color.colorMode } :
            { colorTemperatureMireds: color.colorTemperatureMireds };
    }
    return result;
}

module.exports = { lightInput, temperatureOutput };
