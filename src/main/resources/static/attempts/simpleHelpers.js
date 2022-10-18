// make sure the Math.sign defined, some browsers don't have it yet
if (Math.sign === undefined) {
    Math.sign = function (x) {
        if (+x === x) { // check if a number was given
            return (x === 0) ? x : (x > 0) ? 1 : -1;
        }
        return NaN;
    }
}

function clamp(number, min, max) {
    return Math.min(Math.max(number, min), max);
}

function normalize(vec) {
    mag = Math.sqrt(vec.x * vec.x + vec.y * vec.y);
    return { x: vec.x / mag, y: vec.y / mag };
}

// Returns a random integer from 0 to range - 1. or start to end if two parameters are given.
function randomInt(start, end) {
    if (end === undefined)
        return randomInt(0, start);
    else
        return Math.floor(Math.random() * (end - start)) + start;
}

// Same as randomInt, but returns a float
function randomFloat(start, end) {
    if (end === undefined)
        return randomFloat(0, start);
    else
        return Math.random() * (end - start) + start;;
}

function randomSpread(center, spread) {
    return randomFloat(center - spread, center + spread);
}

function random2DVec(center, spreadVec) {
    return { x: randomSpread(center.x, spreadVec.x), y: randomSpread(center.y, spreadVec.y) };
}

function randomUnitVec(center, spread) {
    angle = randomSpread(center, spread);
    return { x: Math.cos(angle), y: -Math.sin(angle) }
}

function unitVec(angle) {
    return { x: Math.cos(angle), y: -Math.sin(angle) };
}

function clone2DVec(vec) {
    return { x: vec.x, y: vec.y };
}

function addVecs(vec1, vec2) {
    return { x: vec1.x + vec2.x, y: vec1.y + vec2.y };
}

function subVecs(vec1, vec2) {
    return { x: vec2.x - vec1.x, y: vec2.y - vec1.y };
}

function scaleVec(vec, scalar) {
    return { x: vec.x * scalar, y: vec.y * scalar };
}

function vecDir(vec) {
    return Math.atan2(vec.y, vec.x);
}

function angleBetweenVecs(vec1, vec2) {
    return Math.PI - Math.abs(Math.abs(vecDir(vec1) - vecDir(vec2)) - Math.PI);
}

function markForDeletion(array, index) {
    array[index] = undefined;
}

function deleteMarked(array) {
    var newIndex = 0;
    for (var i = 0; i < array.length; i++) {
        if (array[i] !== undefined) {
            array[newIndex] = array[i];
            newIndex += 1;
        }
    }
    return array.slice(0, newIndex);
}

// hsv to rgb
function HSVtoRGB(h, s, v) {
    var r, g, b, i, f, p, q, t;
    if (h && s === undefined && v === undefined) {
        s = h.s, v = h.v, h = h.h;
    }
    i = Math.floor(h * 6);
    f = h * 6 - i;
    p = v * (1 - s);
    q = v * (1 - f * s);
    t = v * (1 - (1 - f) * s);
    switch (i % 6) {
        case 0: r = v, g = t, b = p; break;
        case 1: r = q, g = v, b = p; break;
        case 2: r = p, g = v, b = t; break;
        case 3: r = p, g = q, b = v; break;
        case 4: r = t, g = p, b = v; break;
        case 5: r = v, g = p, b = q; break;
    }
    return {
        r: r,
        g: g,
        b: b
    };
}

function convertHue(hue) {
    hue /= 360.0;
    if (hue < 0)
        hue += 1.0;
    return hue;
}

function componentToHex(c) {
    var hex = Math.round(c * 255).toString(16);
    return hex.length == 1 ? "0" + hex : hex;
}

function rgbToHex(c) {
    return "#" + componentToHex(c.r) + componentToHex(c.g) + componentToHex(c.b);
}
