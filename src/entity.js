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

//NOTES
//Commented out because it's useful, but needs to be rewritten into above
/*class Entity {

    constructor (x, y) {
        this.x = x;
        this.y = y;

        //Look for empty id //TODO <- Just so I can see this. Had ID's so they could be updated client-side, wondering if better solution
        //Linear search
        let found = false;
        let index = 0;
        let max = -1;
        while (!found) {
            //Out of bounds, no gaps
            if (typeof $ENTITIES[index] === 'undefined') {
                this.id = max + 1;
                $ENTITIES.push(this);
                found = true;
            }
            else {
                let id = $ENTITIES[index].id;
                //Greater by 1 or the same
                if (id - max === 1 || id - max === 0) {
                    max = id;
                    index++;
                }
                //Gap
                else if (id - max > 1) {
                    this.id = max + 1;
                    $ENTITIES.push(this);
                    found = true;
                }
            }
        }

        this.controllers = [];
    }

    //Controllers should be chained and permanent/can't remove
    add (controller) {
        this.controllers.push(controller);
    }

    kill () {
        //Binary search
        let floor = -1;
        let ceil  = $ENTITIES.length;
        while (true) {
            //There is still space between bounds
            let index = Math.floor((ceil - floor) / 2) + floor;
            if (ceil - floor > 1) {
                let id = $ENTITIES[index].id;
                if (id === this.id) {
                    $ENTITIES.splice(index, 1);
                    return true;
                }
                else if (id > this.id) {
                    ceil = index;
                }
                else if (id < this.id) {
                    floor = index;
                }
            }
            else {
                return false;
            }
        }
    }

    //Iterates through controllers in chain, updating the data obj
    //Data obj passed through each controller
    //Alternately, data can be set in controllers
    //Set used in case of client-server
    //Uses final x, y to update own pos
    update (data) {
        if (typeof data === 'undefined') {
            data = {x: this.x, y: this.y, ent: this};
            for (let i = 0; i < this.controllers.length; i++) {
                data = this.controllers.update(data);
            }
        }
        else {
            data.ent = this;
            for (let i = 0; i < this.controllers.length; i++) {
                this.controllers.set(data);
            }
        }
        this.x = data.x;
        this.y = data.y;
    }

}

const $COLLIDE = [];
let $DO_COLLIDE = true;
class PhysicsController {

    //Basic physical elements, for mass, speed and friction
    constructor (mass, maxSpeed, frictionCoefficient) {
        this.mass = mass;
        this.maxSpeed = maxSpeed;
        //For friction forces calculation
        if (typeof frictionCoefficient === 'undefined') {this.u = 5;}
        else {this.u = frictionCoefficient;}
        this.velocity = {x: 0, y: 0};

        this.collides = false;
    }

    update (data) {

        let result = {x: 0, y: 0}; //Resultant force

        //Add every force applied to entity
        if (typeof data.forces !== 'undefined') {
            for (let i = 0; i < data.forces.length; i++) {
                result = $VECTOR.add(result, data.forces[i]);
            }
        }

        //Naturally limits speed to max speed - terminal velocity
        //Not drag
        let speed = $VECTOR.mag(this.velocity);
        result = $VECTOR.add(result, $VECTOR.pro(-1 * (speed/this.maxSpeed), result));

        //Friction slows to halt
        let dir = $VECTOR.ang(this.velocity);
        //Friction against direction of velocity, but only if travelling more than 0.4Us^-1
        result = speed <= 0.4 ? result : $VECTOR.add(result, $VECTOR.pro(-1 * this.mass * 10 * this.u, dir));

        //Velocity
        let dVel = $VECTOR.pro(data.dt/this.mass, result);
        let velocity = $VECTOR.add(this.velocity, dVel);

        //Low velocity and no new forces
        if ($VECTOR.mag(velocity) < 0.4 && result.x === 0 && result.y === 0) {
            velocity = {x: 0, y: 0};
        }

        //Finally set velocity
        this.velocity = velocity;

        //Calculate new x, y
        let dDis = $VECTOR.pro(data.dt, this.velocity);
        data.x =+ dDis.x;
        data.y =+ dDis.y;
        if (this.collides) {$COLLIDE.push(this);}
        return data;

    }

    set (data) {
        if (typeof data.velocity !== 'undefined') {this.velocity = data.velocity}
        if (typeof data.mass !== 'undefined') {this.mass = data.mass}
        if (typeof data.maxSpeed !== 'undefined') {this.maxSpeed = data.maxSpeed}
        if (typeof data.u !== 'undefined') {this.u = data.u}
        if (typeof data.forces !== 'undefined') {this.forces = data.forces;}
    }

}

const $CONTROLLERS = {
    phy: PhysicsController
};*/
