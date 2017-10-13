"use strict";

class Chunk {
    //length of sides in units (u)
    static get units () {return 12;}

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
            }
            chunks.push(col);
        }
        return chunks;
    }

    //width and height (in chunks) => w, h
    constructor (w, h) {
        this.width = w * Chunk.units;
        this.height = h * Chunk.units;
        this.children = [];
        this.chunks = World.initChunks(this.width, this.height);
    }

    //Coords for anywhere in the world
    getChunk (x, y) {
        let units = Chunk.units;
        let chunkX = (x - x%units)/units;
        let chunkY = (y - y%units)/units;
        return this.chunks[chunkX][chunkY];
    }

    addChild (child) {
        this.children.push(child);
        this.getChunk(child.x, child.y).addChild(child);
    }
    removeChild (child) {
        let index = this.children.indexOf(child);
        if (index > -1) {
            this.children.splice(index, 1);
            this.getChunk(child.x, child.y).removeChild(child);
        }
    }
}

const world = new World(12, 6);
let obj = {x: 23, y: 35, test: function () {console.log("my name is jeff")}};
world.addChild(obj);
let content = world.getChunk(obj.x, obj.y).children;
for (let i = 0; i < content.length; i++) {
    content[i].test();
}