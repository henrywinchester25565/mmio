//DESC: ESSENTIALLY JUST A WAY OF ORGANISING EVERYTHING IN A COORDINATE SPACE
"use strict";

//LOADED
console.log("Loaded: world.js");

//REQUIREMENTS
const $BOUNDS = require('./bounds.js');

//PARAMETERS
const $CHUNK_SIZE = 24;

//CHUNK
//Extends box because bounding already supplies testing for bounds
/*Entities may exist in more than one chunk at a time (like a large wall), it's the role of the higher levels to handle this
* since the purpose of the world and chunks is organisation*/
class Chunk {

    //chunk x and y => x, y
    constructor (x, y) {
        this.type = 'chunk';
        this.x = x;
        this.y = y;
        this.bounds = new $BOUNDS.bounds.box(this.x, this.y, $CHUNK_SIZE, $CHUNK_SIZE);
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
class World {

    //Width and height in units
    constructor (w, h) {
        this.w = w;
        this.h = h;
        this.changedChildren = [];
        this.children = [];
        this.buildChunks();
    }

    //w, h in chunks
    buildChunks () {
        this.chunks = [];
        let w = this.w/$CHUNK_SIZE;
        let h = this.h/$CHUNK_SIZE;
        for (let x = 0; x < w; x++) {
            for (let y = 0; y < h; y++) {
                this.chunks.push(new Chunk(x * $CHUNK_SIZE, y * $CHUNK_SIZE));
            }
        }
    }

    //handles entities moving chunks
    chunkChanges (entities) {
        for (let i = 0; i < entities.length; i++) {
            this.removeChild(entities[i]);
        }
        let collisions = $BOUNDS.getCollisions(this.chunks, entities);
        for (let i = 0; i < collisions.length; i++) {
            let pair = collisions[i];
            console.log(pair[0].type, pair[1].type);
            //If one is a chunk, then add entity to chunk
            if (pair[0].type === 'chunk') {
                pair[0].addChild(pair[1]);
            }
            else if (pair[1].type === 'chunk') {
                pair[1].addChild(pair[0]);
            }
        }
    }

    //queue
    //added when handling changed/moved children every 50ms
    queueChild (entity) {
        this.changedChildren.push(entity);
    }

    //readies the world
    start () {
        console.log('>> Starting World');
        this.chunkChanges(this.changedChildren);
    }

    //Remove from chunks
    removeChild (entity) {
        //Check where entity appears and remove
        for (let i = 0; i < this.chunks.length; i++) {
            let index = this.chunks[i].children.indexOf(entity);
            if (index > -1) {
                this.chunks[i].children.splice(index, 1);
            }
        }
    }

    //Remove from everything
    killChild (entity) {
        entity.kill();
        this.removeChild(entity);
        let index = this.children.indexOf(entity);
        if (index > -1) {
            this.children.splice(index, 1);
        }
    }

    //Scrape and store changed children only
    scrape () {
        let scrapedChildren = [];
        for (let i = 0; i < children.length; i++) {
            scrapedChildren.push(this.changedChildren[i].scrape());
        }
        return {children: scrapedChildren};
    }

    //For new players
    scrapeAll () {
        let scrapedChildren = [];
        for (let i = 0; i < this.children.length; i++) {
            scrapedChildren.push(this.children[i].scrape());
        }
        return {
            w: this.w,
            h: this.h,
            children: scrapedChildren
        };
    }

}

//EXPORTS
module.exports = World;