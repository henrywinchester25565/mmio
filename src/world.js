//DESC: ESSENTIALLY JUST A WAY OF ORGANISING EVERYTHING IN A COORDINATE SPACE
"use strict";

//LOADED
console.log("Loaded: world.js");

//REQUIREMENTS
const $BOUNDS = require('./bounds.js');
const $EVENTS = require('./events.js');

//PARAMETERS
const $CHUNK_SIZE = 24;

//CHUNK
//Extends box because bounding already supplies testing for bounds
/*Entities may exist in more than one chunk at a time (like a large wall), it's the role of the higher levels to handle this
* since the purpose of the world and chunks is organisation*/
//AFTER DEVELOPMENT, DISCOVERED NOT NEEDED
//Could be deleted, or left in incase of optimisation requirements.
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
let tick = 0;
const $TIME_STEP = 15; //update interval in ms
class World {

    //Width and height in units
    constructor (w, h) {
        this.w = w;
        this.h = h;
        this.queued = [];
        this.children = [];
        this.buildChunks();
        
        this.events = new $EVENTS.handler();

        this.running = false;
    }
    
    //Wrapper for update event
    onUpdate (handler) {
        this.events.on('update', handler);
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
            //If one is a chunk, then add entity to chunk
            let entity;
            if (pair[0].type === 'chunk') {
                entity = pair[1];
                pair[0].addChild(pair[1]);
            }
            else {
                entity = pair[0];
                pair[1].addChild(pair[0]);
            }
        }
    }

    //queue
    //added when handling changed/moved children every 50ms
    queueChild (entity) {
        entity.changed = true;
        this.queued.push(entity);
        this.children.push(entity);
    }

    //TODO SEE IF I CAN JUST USE ABOVE WITHOUT STUFF
    addChild (entity) {
        entity.changed = true;
        this.children.push(entity);
    }

    //the update loop
    update (self) {
        tick++;
        if (self.running) {
            //Keep track of which children are changed while updating
            let changed = [];
            let collisions = $BOUNDS.getCollisions(self.children);
            for (let i = 0; i < collisions.length; i++) {
                let pair = collisions[i];
                pair[0].collide(pair[1], $TIME_STEP);
                pair[1].collide(pair[0], $TIME_STEP);
            }

            for (let i = 0; i < self.children.length; i++) {
                let child = self.children[i];
                
                if (child.alive) {
                    child.update($TIME_STEP);
                }
                else {
                    child.changed = true;
                    self.removeChild(child);
                    self.children.splice(i, 1);
                }
                
                if (child.changed) { //if changed
                    if (changed.indexOf(child === -1)) {
                        changed.push(child);
                    }
                    child.changed = false;
                }
            }
            self.chunkChanges(changed);
            self.events.emit('update', changed);
            setTimeout(self.update, $TIME_STEP, self);
            
        }
    }

    //readies the world
    start () {
        this.running = true;
        console.log('>> Starting World');
        this.chunkChanges(this.queued);
        delete this.queued;
        let self = this;
        setTimeout(this.update, $TIME_STEP, self);
    }

    //stops the world
    stop () {
        console.log('>> Stopping World');
        this.running = false;
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
        //Dead children get picked up in update loop
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
