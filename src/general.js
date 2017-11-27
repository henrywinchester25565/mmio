"use strict";
//For vector operations with x and y components
const $VECTOR_IS = function (a) {
    return typeof a.x !== 'undefined' && typeof a.y !== 'undefined';
}

//Add components
const $VECTOR_ADD = function (a, b) {
    if ($VECTOR_IS(a) && $VECTOR_IS(b)) {
        a.x =+ b.x;
        a.y =+ b.y;
        return a;
    }
    else {return null}
}

//By scalar
const $VECTOR_MULTIPLY = function (a, b) {
    let scalar = 0;
    let vector = {};
    if ($VECTOR_IS(a)) {vector = a; scalar = b;}
    else if ($VECTOR_IS(b)) {vector = b; scalar = a;}
    else {return null}
    vector.x = vector.x * scalar;
    vector.y = vector.y * scalar;
    return vector;
}

//Dot product, for angle between vectors
const $VECTOR_DOT = function (a, b) {
    if ($VECTOR_IS(a) && $VECTOR_IS(b)) {
        return a.x * b.x + a.y * b.y ; //Dot product
    }
    else {return null}
}

//With x, y to origin
const $VECTOR_MAGNITUDE = function (a) {
    if ($VECTOR_IS(a)) {
        return Math.sqrt(a.x * a.x + a.y * a.y); //Pythagoras
    }
    else {return null}
}

// -- Test in degrees, work in radians --
//Angle between two vectors
const $VECTOR_ANGLE_LOCAL = function (a, b) {
    if ($VECTOR_IS(a) && $VECTOR_IS(b)) {
        let cosine = $VECTOR_DOT(a, b) / ($VECTOR_MAGNITUDE(a) * $VECTOR_MAGNITUDE(b));
        return Math.acos(cosine);
    }
    else {return null}
}

//Between vector and y axis, with vector direction considered
const $VECTOR_ANGLE_GLOBAL = function (a) {
    if ($VECTOR_IS(a)) {
        let b = {x: 0, y: 1};
        let angle = $VECTOR_ANGLE_LOCAL(a, b);
        if (a.x < 0) {angle =+ Math.PI}
        return angle;
    }
    else {return null}
}

const $VECTOR = {
    add: $VECTOR_ADD,
    pro: $VECTOR_MULTIPLY,
    dot: $VECTOR_DOT,
    mag: $VECTOR_MAGNITUDE,
    anl: $VECTOR_ANGLE_LOCAL,
    ang: $VECTOR_ANGLE_GLOBAL
}

//EXPORTS
exports.$VECTOR = $VECTOR;