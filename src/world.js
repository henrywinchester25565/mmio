"use strict";
const $ENTITY = require('./entity.js').$ENTITY;
const $AABB = require('./bounds.js').$AABB;

//Chunk side length in units
const $CHUNK_SIZE = 24;
class Chunk extends $AABB {

    //chunk x and y => x, y
    constructor (x, y) {
        super (x, y, $CHUNK_SIZE, $CHUNK_SIZE);
        this.children = [];
    }

    addChild (child) {
        this.children.push(child);
    }
    removeChild (child) {
        let index = this.children.indexOf(child);
        if (index > -1) {
            this.children.splice(index, 1);
        }
    }

}

class World {

    constructor () {

    }

}

