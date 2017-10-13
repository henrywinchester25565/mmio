"use strict";

class Light {
    //TODO
}

class Entity {

    //Resistance forces
    static get resForce () {return [1,1,1];} //just a static variable

    //has a world variable
    //x and y in position
    constructor (x, y, mass) {
        this.x = x;
        this.y = y;
        this.mass = typeof mass !== 'undefined' ? mass : 0; //mass of warrior = 1
        this.forces = [];
    }

    setVelocity (value) {
        if (value.isArray()) {this.velocity = value;}
        else {
            this.velocity = [];
            for (let i = 0; i < this.velocity.length; i++) {
                this.velocity[i] = value;
            }
        }
    }
    //dt is delta time
    getVelocity (dt) {
        if (this.velocity === null) {this.velocity = [];}
        if (this.forces.length !== 0) {
            let result = this.forces[0];
            for (let i = 0; i < this.forces.length; i++) {
                result = Vector.add(result, this.forces[i]); //Not imported
            }
            if (this.mass !== 0) { //for acceleration
                result = Vector.multiply(1/this.mass, result);
            }
            result = Vector.multiply(dt, result); //delta velocity
            this.velocity = Vector.add(result, this.velocity);
        }
        return this.velocity;
    }

    //dt is delta time
    updatePos (dt) {
        let pos = [];
        pos[0] = this.x; pos[1] = this.y;
        let dp = Vector.multiply(dt, this.getVelocity(dt)); //Change in position by product of dt and velocity (update velocity at same time)
        pos = Vector.add(pos, dp);
        this.x = pos[0];
        this.y = pos[1];
    }
}