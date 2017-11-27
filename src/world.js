//DESC: ESSENTIALLY JUST A WAY OF ORGANISING EVERYTHING IN A COORDINATE SPACE
"use strict";

//LOADED
console.log("Loaded: world.js");

//REQUIREMENTS
const $BOUNDS = require('./bounds.js').bounds;

//PARAMETERS
const $CHUNK_SIZE = 24;

//CHUNK
//Extends box because bounding already supplies testing for bounds
/*Entities may exist in more than one chunk at a time (like a large wall), it's the role of the higher levels to handle this
* since the purpose of the world and chunks is organisation*/
class Chunk extends $BOUNDS.box {

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
        if (index !== -1) {
            this.children.splice(index, 1);
        }
    }

}

//WORLD
//A group of chunks with no predetermined size
class World extends $BOUNDS.box {

    //Width and height in units
    constructor (w, h) {
        super (0, 0, w, h);
        this.children = [];
        this.chunks = [];
    }

    addChild (entity) {
        //Need to check if it's in the bounds of any chunks
        $BOUNDS.cast(this.chunks, entity);
        //TODO finish $BOUNDS.cast function
    }

    //Creates a 'generic' world for testing purposes
    static createGeneric (w, h) {
        //TODO create a generic world
    }

}

