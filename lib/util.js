//some util functions and stuff
"use strict";

class Matrix {
    static add (a, b) {
        //TODO
    }

    static minus (a, b) {
        //TODO
    }

    static multiply (a, b) {
        //TODO
    }
}

//TODO use x and y instead of array
class Vector {

    //Add two vectors
    static add (a, b) {
        let r = {x: a.x + b.x, y: a.y + b.y};
        return r;
    }

    //Minus a vector from another vector
    static sub (a, b) {
        let r = {x: a.x - b.x, y: a.y - b.y};
        return r;
    }

    //Num and vector
    static multiply (a, b) {
        //2 nums
        if (typeof a === 'number' && typeof b === 'number') {
            return a * b;
        }
        //1 num, 1 vector
        else if (typeof a === 'number' || typeof b === 'number') {
            let num = typeof a === 'number' ? a : b;
            let vector = typeof a !== 'number' ? a : b;
            return {x: num * vector.x, y: num * vector.y};
        }
        else {
            return {x: a.x * b.x, y: a.y * b.y};
        }
    }


    //magnitude
    static mag (a) {
        let mag = a.x * a.x;
        mag = mag + a.y * a.y;
        mag = Math.sqrt(mag);
        return mag;
    }

    //direction vector
    static dir (a) {
        let direction = {};
        if (a.x === 0 && a.y === 0) {direction = [0 ,0];}
        else {
            let angle = a.x !== 0 ? Math.abs(Math.atan(a.y/a.x)) : Math.PI;
            direction.x = a.x >= 0 ? Math.cos(angle) : -1 * Math.cos(angle);
            direction.y = a.y >= 0 ? Math.sin(angle) : -1 * Math.sin(angle);
        }
        return direction;
    }
}

//search array elements for id
const SEARCH = function (id, array) {
    if (array.isArray()) {
        if (typeof id === 'number' && array[id].id === id) {return array[id];}
        for (let i = 0; i < array.length; i++) {
            if (array[i].id === id) {return array[i];}
        }
    }
    return null;
}

//EXPORTS
exports.vector = Vector;
exports.search = SEARCH;
