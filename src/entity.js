//DESC: ENTITIES ARE OBJECTS REPRESENTED IN THE X, Y COORDINATE SPACE
"use strict";

//LOADED
console.log("Loaded: entity.js");

//REQUIREMENTS
const $VECTOR = require('./general').vector;
const $BOUNDS = require('./bounds');
const $EVENTS = require('./events.js');

//BASE CLASS
class Entity {

    constructor (x, y) {
        this.x = x;
        this.y = y;

        this.events = new $EVENTS.handler();
        this.changed = false;
        this.collides = false;

        this.type = 'entity'; //Type of entity
        this.bounds = new $BOUNDS.bounds.point(this.x, this.y);
    }

    //Wrapper for death event
    onKill (handler) {
        this.events.on('killed', handler);
    }

    kill () {
        this.events.emit('killed');
    }

    scrape () {
        return {
            x: this.x,
            y: this.y,
            type: this.type,
            bounds: this.bounds.scrape()
        }
    }

}

class Wall extends Entity {

    constructor (x, y, w, h) {
        super(x, y);
        this.w = w;
        this.h = h;

        this.collides = true;

        this.type = 'wall';
        this.bounds = new $BOUNDS.bounds.box(this.x, this.y, w, h);
    }

    //Get the minimum data for client transfer
    scrape () {
        return {
            x: this.x,
            y: this.y,
            w: this.w,
            h: this.h,
            type: this.type,
            bounds: this.bounds.scrape()
        }
    }

}

class StaticLight extends Entity {

    constructor (x, y, color, intensity) {
        super (x, y);

        this.color = color;
        this.intensity = intensity;
    }

}

//ALL ENTITIES
const $ENTITIES = {
    entity: Entity,
    wall: Wall,
    light_s: StaticLight
};

//CHECK IF ENTITY
const $IS_ENTITY = function (entity) {
    return $ENTITIES[entity.type] !== undefined;
};

//EXPORTS
exports.ents = $ENTITIES;
exports.isEnt = $IS_ENTITY;