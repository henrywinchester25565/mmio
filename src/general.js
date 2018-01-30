//DESC: GENERAL FUNCTIONALITY
"use strict";

//LOADED
console.log("Loaded: general.js");

//VECTORS
//For vector operations with x and y components
const $VECTOR_IS = function (a) {
    return typeof a.x !== 'undefined' && typeof a.y !== 'undefined';
};

//Add components
const $VECTOR_ADD = function (a, b) {
    if ($VECTOR_IS(a) && $VECTOR_IS(b)) {
        return {
            x: a.x + b.x,
            y: a.y + b.y
        };
    }
    else {return null}
};

//By scalar
const $VECTOR_MULTIPLY = function (a, b) {
    let scalar = 0;
    let vector = {};
    if ($VECTOR_IS(a)) {vector = a; scalar = b;}
    else if ($VECTOR_IS(b)) {vector = b; scalar = a;}
    else {return null}
    return {
        x: vector.x * scalar,
        y: vector.y * scalar
    };
};

//Dot product, for angle between vectors
const $VECTOR_DOT = function (a, b) {
    if ($VECTOR_IS(a) && $VECTOR_IS(b)) {
        return a.x * b.x + a.y * b.y ; //Dot product
    }
    else {return null}
};

//With x, y to origin
const $VECTOR_MAGNITUDE = function (a) {
    if ($VECTOR_IS(a)) {
        return Math.sqrt(a.x * a.x + a.y * a.y); //Pythagoras
    }
    else {return null}
};

// -- Test in degrees, work in radians --
//Angle between two vectors
const $VECTOR_ANGLE_LOCAL = function (a, b) {
    if ($VECTOR_IS(a) && $VECTOR_IS(b)) {
        let div = $VECTOR_MAGNITUDE(a) * $VECTOR_MAGNITUDE(b);
        if (div === 0) {return null}
        let cosine = $VECTOR_DOT(a, b) / ($VECTOR_MAGNITUDE(a) * $VECTOR_MAGNITUDE(b));
        return Math.acos(cosine);
    }
    else {return null}
};

//Between vector and y axis, with vector direction considered
const $VECTOR_ANGLE_GLOBAL = function (a) {
    if ($VECTOR_IS(a)) {
        let b = {x: 0, y: 1};
        let angle = $VECTOR_ANGLE_LOCAL(a, b);
        if (a.x < 0) {angle = Math.PI * 2 - angle}
        return angle;
    }
    else {return null}
};

const $VECTOR_FROM_DIR = function (scalar, direction) {
    return {
        x: scalar * Math.sin(direction),
        y: scalar * Math.cos(direction)
    };
};

const $VECTOR_NORMALISE = function (a) {
    if ($VECTOR_IS(a)) {
        let mag = $VECTOR_MAGNITUDE(a);
        if (mag > 0) {
            return {
                x: a.x / mag,
                y: a.y / mag
            }
        }
        //in case of bad vector
        else {
            return {
                x: 0,
                y: 0
            }
        }
    }
    else {return null;}
};

const $VECTOR_CLONE = function (a) {
    if ($VECTOR_IS(a)) {
        return {
            x: a.x,
            y: a.y
        }
    }
    else {return null;}
};

//ALL VECTOR OPERATIONS
const $VECTOR = {
    add: $VECTOR_ADD,
    pro: $VECTOR_MULTIPLY,
    dot: $VECTOR_DOT,
    mag: $VECTOR_MAGNITUDE,
    anl: $VECTOR_ANGLE_LOCAL,
    ang: $VECTOR_ANGLE_GLOBAL,
    vfd: $VECTOR_FROM_DIR,
    nrm: $VECTOR_NORMALISE,
    cln: $VECTOR_CLONE
};

//ARRAY OPERATIONS
//Removes an element from an array
const $ARRAY_REMOVE = function (array, obj) {
    let index = array.indexOf(obj);
    if (index > -1) {
        array.splice(index, 1);
        return true;
    }
    return false;
};

//ALL ARRAY OPERATIONS
const $ARRAY = {
    rmv: $ARRAY_REMOVE
};

//EXPORTS
exports.vector = $VECTOR;
exports.array = $ARRAY;