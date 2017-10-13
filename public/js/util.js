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

class Vector {

    //Add two vectors
    static add (a, b) {
        let max = a.length > b.length ? b.length : a.length;
        let result = [];
        for (let i = 0; i < max; i++) {
            if (a[i] === null) {
                result.push(b[i]);
            }
            else if (b[i] === null) {
                result.push(a[i]);
            }
            else {
                result.push(a[i] + b[i]);
            }
        }
        return result;
    }

    //Minus a vector from another vector
    static sub (a, b) {
        let max = a.length > b.length ? a.length : b.length;
        let result = [];
        for (let i = 0; i < max; i++) {
            if (a[i] === null) {
                result.push(b[i]);
            }
            else if (b[i] === null) {
                result.push(a[i]);
            }
            else {
                result.push(a[i] + b[i]);
            }
        }
        return result;
    }

    //Num and vector
    static multiply (a, b) {
        if (!(a.isArray() && b.isArray())) {
            let num = a.isArray() ? b : a;
            let vector = a.isArray() ? a : b;
            let result = [];
            for (let i = 0; i < vector.length; i++) {
                result[i] = num * vector[i];
            }
            return result;
        }
        else return null; //TODO
    }
}