//DESC: ENTITIES ARE OBJECTS REPRESENTED IN THE X, Y COORDINATE SPACE
"use strict";

//LOADED
console.log("Loaded: entity.js");

//REQUIREMENTS
const $VECTOR = require('./general').vector;
const $BOUNDS = require('./bounds');
const $EVENTS = require('./events.js');
const $UUID   = require('uuid/v1');

//BASE CLASS
class Entity {

    constructor (x, y) {
        this.x = x;
        this.y = y;

        this.id = $UUID();

        this.events = new $EVENTS.handler();
        this.changed = false;
        this.collides = false;

        this.type = 'entity'; //Type of entity
        this.bounds = new $BOUNDS.bounds.point(this.x, this.y);
    }

    //EVENT WRAPPERS
    //Kill
    onKill (handler) {
        this.events.on('killed', handler);
    }

    kill () {
        this.events.emit('killed');
    }

    //Update
    onUpdate (handler) {
        this.events.on('update', handler);
    }

    update (dt) {
        this.events.emit('update', dt);
    }

    //Collide
    onCollide (handler) {
        this.events.on('collide', handler);
    }

    //collision referencing what it collided with
    collide (collision, dt) {
        this.events.emit('collide', collision, dt)
    }

    scrape () {
        return {
            x: this.x,
            y: this.y,
            type: this.type,
            id: this.id
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
            id: this.id
        }
    }

}

class Light extends Entity {

    constructor (x, y, color, intensity, distance) {
        super (x, y);
        this.color = color;
        this.intensity = intensity;
        this.distance = distance;

        this.type = 'light';
    }

    scrape () {
        return {
            x: this.x,
            y: this.y,
            color: this.color,
            intensity: this.intensity,
            distance: this.distance,
            type: this.type,
            id: this.id
        };
    }

}

//PHYSICS
//Using the metric system, 1u = 1m (roughly)
const $FRICTION = 0.6;
const $GRAVITY = 9.81;
class Physics extends Entity {

    constructor (x, y, r, m, s) {
        super(x, y);
        this.radius = r || 0.5; //Dynamic entities should be circles
        this.physics = true;

        //Speed and Velocity
        this.velocity = {x: 0, y: 0};
        this.maxSpeed = s || 10;

        //Force and Momentum
        this.forces = [];
        this.mass = m || 1;
        this.friction = this.mass * $GRAVITY * $FRICTION; //Magnitude of friction force

        let self = this; //Reference to entity
        //Set changed
        //Physics calcs when updated
        this.onUpdate(function (dt) {

            //dt in ms, so convert to s
            dt = dt/1000;

            //Calculate total force on entity
            let force = {x: 0, y: 0};
            for (let i = 0; i < self.forces.length; i++) {
                force = $VECTOR.add(force, self.forces[i]);
            }

            //New velocity from force, for resistance calcs
            let vel = $VECTOR.pro(dt, $VECTOR.pro(1/self.mass, force));
            vel = $VECTOR.add(self.velocity, vel);

            //Apply friction
            if ($VECTOR.mag(self.velocity) > 0.2 || $VECTOR.mag(force) > self.friction) {
                //speed>0.2 because needs a buffer between 0 so friction doesn't cause the entity to 'shake'
                //force>friction so force great enough to do something
                let friction = $VECTOR.vfd(self.friction, $VECTOR.ang(vel)); //In direction of friction
                friction = $VECTOR.pro(-1, friction); //In opposite direction to force
                force = $VECTOR.add(force, friction); //Total forces
            }
            else {
                self.velocity = {x: 0, y: 0};
            }

            //Artificial terminal velocity for max speeds
            /*let drag = $VECTOR.pro((-1 * ($VECTOR.mag(vel)/self.maxSpeed)), force);
            force = $VECTOR.add(force, drag);*/

            //Final velocity calculation
            vel = $VECTOR.pro(dt, $VECTOR.pro(1/self.mass, force));
            self.velocity = $VECTOR.add(self.velocity, vel);

            //Update entity position
            let dp = $VECTOR.pro(dt, self.velocity);
            if (self.x !== self.x + dp.x || self.y !== self.y + dp.y) {
                self.changed = true;
                self.x = self.x + dp.x;
                self.y = self.y + dp.y;
                self.bounds.update(self.x, self.y);
            }
            self.forces = [];
        });

        //Handle collisions
        this.wallBounce = true;
        this.onCollide(function (entity, dt) {
            //console.log(entity);
            dt = dt/1000; //into seconds
            let normal = self.bounds.getNormal(entity.bounds);
            //console.log('pos:', self.x, self.y);

            //For impacts with circles
            if (entity.physics === true) {



            }

            //For things like walls
            else { //Reflect velocity, instead of two dimensional circle collisions

                let bounce = -1; //If it doesn't bounce
                if (self.wallBounce) {bounce = -2;} //If it does

                let v = self.velocity;
                let angle = $VECTOR.anl(v, normal);
                if (angle > Math.PI/4) {
                    angle = Math.PI - angle; //Acute angle
                }
                else {
                    normal = $VECTOR.pro(-1, normal); //Flip normal to oppose velocity
                }

                let vn = $VECTOR.mag(v) * Math.cos(angle); //Velocity in direction of normal
                let dv = vn * -bounce; //so velocity equal to v + -2*v
                let force = $VECTOR.pro(self.mass/dt,$VECTOR.pro(dv, normal)); //Normal force
                self.forces.push(force);
            }

        });

        this.type = 'phys';
        this.bounds = new $BOUNDS.bounds.circle(this.x, this.y, this.radius);
    }

    scrape () {
        return {
            x: this.x,
            y: this.y,
            r: this.radius,
            id: this.id,
            type: this.type
        };
    }

}

//ALL ENTITIES
const $ENTITIES = {
    entity: Entity,
    wall: Wall,
    light: Light,
    phys: Physics
};

//CHECK IF ENTITY
const $IS_ENTITY = function (entity) {
    return $ENTITIES[entity.type] !== undefined;
};

//EXPORTS
exports.ents = $ENTITIES;
exports.isEnt = $IS_ENTITY;