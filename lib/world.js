"use strict";
const entity = require('./entity.js');

class Chunk {
    //length of sides in units (u)
    static get units () {return 24;}

    //chunk x and y => x, y
    constructor (x, y) {
        this.x = x;
        this.y = y;
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
    //chunks[w][h]
    static initChunks (w, h) {
        let chunks = [];
        let units = Chunk.units;
        for (let i = 0; i < w; i = i + units) {
            let col = [];
            for (let j = 0; j < h; j = j + units) {
                let chunk = new Chunk(i, j);
                col.push(chunk);
                //console.log(chunk);
            }
            chunks.push(col);
        }
        return chunks;
    }

    //width and height (in chunks) => w, h
    constructor (w, h) {
        this.w = w * Chunk.units;
        this.h = h * Chunk.units;
        this.children = [];
        this.chunks = World.initChunks(this.w, this.h);
        this.dtx = 1; //time multi
    }

    //Coords for anywhere in the world
    getChunk (x, y) {
        let units = Chunk.units;
        let chunkX = (x - x%units)/units;
        let chunkY = (y - y%units)/units;
        return this.chunks[chunkX][chunkY];
    }
    inBounds (x, y) {
        if ((x < 0 || x >= this.w) || (y < 0 || y >= this.h)) {return false;}
        return true;
    }

    addChild (child) {
        this.children.push(child);
        this.getChunk(child.x, child.y).addChild(child);
    }
    //Should sort children and use a binary search for better speed
    //Could have possibly hundreds of entities in a game
    removeChild (child) {
        let index = this.children.indexOf(child);
        if (index > -1) {
            this.children.splice(index, 1);
            this.getChunk(child.x, child.y).removeChild(child);
        }
    }

    update (dt) {
        dt = dt/1000; //ms to s for calculations
        dt = dt * this.dtx; //x multi (for slo mo)
        this.dtx = 1;

        let chunks = this.getChunks();

        //update all the children
        for (let i = 0; i < chunks.length; i++) {
            for (let j = 0; j < chunks[i].children.length; j++) {
                //console.log(chunks[i].children[j]);
                //Swaps child's chunk after updates
                let child = chunks[i].children[j];
                child.update(dt);
                if (this.inBounds(child.x, child.y)) {
                    let chunk = this.getChunk(child.x, child.y);
                    if (chunk !== chunks[i]) {
                        chunks[i].removeChild(child);
                        chunk.addChild(child);
                    }
                }
            }

        }
    }

    //Based on players
    //update chunks with players in, and around
    getChunks () {
        let chunks = [];
        //Chunks should only appear in chunks[] once
        //TODO refine this
        for (let i = 0; i < entity.$PLAYERS.length; i++) {
            if (this.inBounds(entity.$PLAYERS[i].x, entity.$PLAYERS[i].y)) {
                let plyChunk = this.getChunk(entity.$PLAYERS[i].x, entity.$PLAYERS[i].y);
                if (chunks.indexOf(plyChunk) === -1) {
                    chunks.push(plyChunk);
                    let ox = plyChunk.x - Chunk.units*3;
                    let oy = plyChunk.y - Chunk.units*3;
                    //7*7 pattern should be enough... hopefully.
                    for (let j = 0; j < 7 * Chunk.units; j = j + Chunk.units) {
                        for (let k = 0; k < 7 * Chunk.units; k = k + Chunk.units) {
                            if (this.inBounds(ox + j, oy + k)) {
                                let chunk = this.getChunk(ox + j, oy + k);
                                if (chunks.indexOf(chunk) === -1 && typeof chunk !== 'undefined') {
                                    chunks.push(chunk);
                                }
                            }
                        }
                    }
                }
            }
        }
        return chunks;
    }
}

//EXPORTS
module.exports = (w, h) => {
    return new World (w, h);
}