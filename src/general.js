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
        return {
            x: a.x + b.x,
            y: a.y + b.y
        };
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
    return a.x * b.x + a.y * b.y ; //Dot product
};

//With x, y to origin
const $VECTOR_MAGNITUDE = function (a) {
    return Math.sqrt(a.x * a.x + a.y * a.y); //Pythagoras
};

//Angle between two vectors
const $VECTOR_ANGLE_LOCAL = function (a, b) {
    let div = $VECTOR_MAGNITUDE(a) * $VECTOR_MAGNITUDE(b);
    if (div === 0) {return null}
    let cosine = $VECTOR_DOT(a, b) / ($VECTOR_MAGNITUDE(a) * $VECTOR_MAGNITUDE(b));
    return Math.acos(cosine);
};

//Between vector and y axis, with vector direction considered
const $VECTOR_ANGLE_GLOBAL = function (a) {
    let b = {x: 0, y: 1};
    let angle = $VECTOR_ANGLE_LOCAL(a, b);
    if (a.x < 0) {angle = Math.PI * 2 - angle}
    return angle;
};

const $VECTOR_FROM_DIR = function (scalar, direction) {
    return {
        x: scalar * Math.sin(direction),
        y: scalar * Math.cos(direction)
    };
};

const $VECTOR_NORMALISE = function (a) {
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
            x: -1,
            y: 0
        }
    }
};

const $VECTOR_CLONE = function (a) {
    return {
        x: a.x,
        y: a.y
    }
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
