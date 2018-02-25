//DESC: ENTITIES ARE OBJECTS REPRESENTED IN THE X, Y COORDINATE SPACE
"use strict";

//LOADED
console.log("Loaded: entity.js");

//REQUIREMENTS
const $VECTOR = require('./general').vector;
const $BOUNDS = require('./bounds');
const $EVENTS = require('./events.js');
const $UUID   = require('uuid/v4');

//BASE CLASS
//Entity base class
class Entity {

    constructor (x, y) {
        this.x = x;
        this.y = y;

        //Angle
        this.a = 0; //Not used in all entities

        this.id = $UUID();

        this.events = new $EVENTS.handler();
        this.changed = false;
        this.collides = false;

        this.type = 'entity'; //Type of entity
        this.bounds = new $BOUNDS.bounds.point(this.x, this.y);

        let self = this;
        this.events.on('killed', function () {
            self.alive = false;
        });
        this.alive = true;
    }

    //If its angle gets changed, mark as changed
    set angle (angle) {
        this.a = angle;
        this.changed = true;
    }

    get angle () {
        return this.a;
    }

    //EVENT WRAPPERS
    //Kill
    onKill (handler) {
        this.events.on('killed', handler);
    }

    kill () {
        this.events.emit('killed');
        this.alive = false; //Once finished death calls
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
            id: this.id,
            alive: this.alive
        }
    }

}

//WALL
//For static, immovable rectangular objects
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
            id: this.id,
            alive: this.alive
        }
    }

}

//LIGHT
//For (typically) static lights
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
            id: this.id,
            alive: this.alive
        };
    }

}

//PHYSICS
//Using the metric system, 1u = 1m (roughly)
const $FRICTION  = 0.6; //Very high coefficient of friction
const $GRAVITY   = 9.81; //Acceleration due to gravity ms^-2
const $AIR       = 1.225; //Mass density of air kgm^3
//Inherits point bounds
//Classes using physics should inherit from this, and modify bounds
class Physics extends Entity {

    constructor (x, y) {
        super(x, y);
        this.physics = true;

        //Velocity
        this.velocity = {x: 0, y: 0};

        //Force and Momentum
        this.forces = [];
        this.mass = 100;

        //Friction
        this.friction = this.mass * $GRAVITY * $FRICTION; //Magnitude of normal force

        //Drag
        this.area = 0.1; //Cross sectional area, should be 0 but required for drag
        this.drag = 1.2; //Drag coefficient of a standing man

        //Physics collisions
        this.collisions = [];
        this.collides = true;

        let self = this; //Reference to entity
        //Set changed
        //Physics calcs when updated
        //TODO remove function from constructor and use call function on below instead
        this.onUpdate(function (dt) {

            //dt in ms, so convert to s
            dt = dt/1000;

            //Calculate total force on entity
            let force = {x: 0, y: 0};
            for (let i = 0; i < self.forces.length; i++) {
                force = $VECTOR.add(force, self.forces[i]);
            }

            //Create a copy of pre-collision force
            let colForce = {};
            Object.assign(colForce, force);

            //Collision handling
            //Only handles forces acting on self
            for (let i = 0; i < self.collisions.length; i++) {
                let collision = self.collisions[i];
                let normal = collision.normal;

                //If wall collision
                if (collision.static) {
                    //Normal is normalised so can be used with dot product for magnitude of value in dir of normal
                    //Scalar momentum in direction of normal
                    let p = $VECTOR.dot(normal, self.velocity) * self.mass;

                    //Scalar force in direction of normal
                    let f = $VECTOR.dot(normal, colForce);

                    //Only acting in direction of normal
                    p = p < 0 ? 0 : p;
                    f = f < 0 ? 0 : f;

                    //Momentum *-1.4 for bounce (not physically correct, but feels more natural)
                    p = p*-1.4;
                    //Force *-1 to stop movement
                    f = f*-1;
                    //Add impulse to force (p=f*dt)
                    f = f + (p/dt);

                    //Add force in direction of normal to net force
                    force = $VECTOR.add(force, $VECTOR.pro(f, normal));

                    //TODO fix double bounce from walls
                    //^ If collides with two walls, gets force from both
                }
                //If dynamic collision
                else {
                    //Find impulse of other on self
                    let vel = collision.velocity;
                    let mass = collision.mass;

                    //Scalar momentum in direction of normal
                    let p = $VECTOR.dot(normal, vel) * mass;
                    p = p > 0 ? 0 : p;

                    //Add impulse to net force
                    force = $VECTOR.add(force, $VECTOR.pro(p/dt, normal));

                    //Remove impulse of self on other
                    p = $VECTOR.dot(normal, self.velocity) * mass;
                    force = $VECTOR.add(force, $VECTOR.pro(-p/dt, normal));
                    //TODO add force resistance
                    //I have no idea how to get other entities forces into the update cycle
                    //I could split the cycle into smaller chunks but I'd rather not
                    //That's the only solution I can see though.
                }

            }

            //New velocity from force, for resistance calcs
            let vel = $VECTOR.pro(dt, $VECTOR.pro(1/self.mass, force));
            vel = $VECTOR.add(self.velocity, vel);

            let speed = $VECTOR.mag(vel);

            //Apply friction
            if (speed > 0.2 || $VECTOR.mag(force) > self.friction) {
                //speed>0.2 because needs a buffer between 0 so friction doesn't cause the entity to 'shake'
                //force>friction so force great enough to do something
                let friction = $VECTOR.vfd(self.friction, $VECTOR.ang(vel)); //In direction of friction
                friction = $VECTOR.pro(-1, friction); //In opposite direction to force
                force = $VECTOR.add(force, friction); //Total forces
            }
            else {
                self.velocity = {x: 0, y: 0};
            }

            //Drag
            if (speed > 0) {
                //Using the equation Fd = 0.5p(u^2)A
                let scalarDrag = 0.5 * $AIR * speed * speed * self.area;
                //Normalise velocity and multiply by -drag for drag force
                let drag = $VECTOR.pro(-scalarDrag, $VECTOR.nrm(vel));
                force = $VECTOR.add(force, drag);
            }

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
            self.collisions = [];
        });

        //Handle collisions
        this.onCollide(function (entity) {
            //Collision physics must be calculated during the update loop with forces.
            //As such, this is used to obtain the relevant collision information.

            //The collides property used to determine if used in physics collisions
            if (entity.collides && self.collides) {
                //Normal away from self
                let normal = self.bounds.getNormal(entity.bounds);

                //Add to collisions as object containing relevant information
                let collision = {};
                collision.normal = normal;
                collision.static = !entity.physics; //If infinite mass (e.g. walls)

                //Include mass and copy of velocity for dynamic entities
                if (entity.physics) {
                    collision.mass = entity.mass;
                    let vel = {};
                    Object.assign(vel, entity.velocity);
                    collision.velocity = vel;
                }

                //Push to collisions for physics in update loop
                self.collisions.push(collision);
            }
        });

        this.type = 'phys';
    }

    scrape () {
        return {
            x: this.x,
            y: this.y,
            a: this.a,
            id: this.id,
            type: this.type,
            alive: this.alive
        };
    }

}

//PLAYER CLASS
class Player extends Physics {

    constructor (x, y, r) {
        super(x, y);
        this.radius = r || 0.3 * 3;

        //A player with radius 0.4 is considered average,
        //So is given the average mass of an adult male.
        //The constant used allows for scaling.
        this.mass = this.radius * this.radius * Math.PI * 149;

        //Area for drag
        this.area = this.radius * this.radius; //Assume in cube

        //Circle bounds
        this.bounds = new $BOUNDS.bounds.circle(this.x, this.y, this.radius);

        this.type = 'player';
    }

    scrape () {
        return {
            x: this.x,
            y: this.y,
            a: this.a,
            r: this.radius,
            id: this.id,
            type: this.type,
            alive: this.alive
        }
    }

}

//ALL ENTITIES
const $ENTITIES = {
    entity: Entity,
    wall: Wall,
    light: Light,
    phys: Physics,
    ply: Player
};

//CHECK IF ENTITY
const $IS_ENTITY = function (entity) {
    return $ENTITIES[entity.type] !== undefined;
};

//EXPORTS
exports.ents = $ENTITIES;
exports.isEnt = $IS_ENTITY;