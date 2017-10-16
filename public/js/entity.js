"use strict";

class Light {
    //TODO
}

const $ENTITIES = [];
class Entity {

    //Resistance forces
    static get resForce () {return [1,1,1];} //just a static variable

    //has a world variable
    //x and y in position
    constructor (x, y, mass) {
        this.x = x;
        this.y = y;
        this.maxSpeed = 100;
        this.mass = typeof mass !== 'undefined' ? mass : 0; //mass of warrior = 1
        this.forces = [];
        $ENTITIES.push(this);

        this.u = -5; //coefficient of friction
    }

    setVelocity (value) {
        if (Array.isArray(value)) {this.velocity = value;}
        else {
            this.velocity = [];
            for (let i = 0; i < this.velocity.length; i++) {
                this.velocity[i] = value;
            }
        }
    }
    //dt is delta time
    getVelocity (dt) {
        if (typeof this.velocity === 'undefined') {this.setVelocity([0 ,0]);}
        let speed = Entity.getSpeed(this.velocity);
        if (this.forces.length !== 0) {
            let result = this.forces[0];

            for (let i = 0; i < this.forces.length; i++) {
                result = Vector.add(result, this.forces[i]); //Not imported
            }

            let drag = Vector.multiply(-1 * (speed/this.maxSpeed), result); //drag for max speed
            result = Vector.add(result, drag);

            //TODO make this a util method
            let direction = [];
            if (this.velocity[0] === 0 && this.velocity[1] === 0) {direction = [0 ,0];}
            else {
                let angle = this.velocity[0] !== 0 ? Math.abs(Math.atan(this.velocity[1]/this.velocity[0])) : Math.PI;
                direction[0] = this.velocity[0] >= 0 ? Math.cos(angle) : -1 * Math.cos(angle);
                direction[1] = this.velocity[1] >= 0 ? Math.sin(angle) : -1 * Math.sin(angle);
            }

            let friction = Vector.multiply(this.mass * 10 * this.u, direction); //friction
            //console.log(friction);
            result = speed > 0.4 ? Vector.add(result, friction) : result;//TODO change getSpeed to getMag, also make this better
            //result = Math.abs(result[0]) > 2 && Math.abs(result[1]) > 2 ? result : [0, 0];

            if (result[0] === 0 && result[1] === 0 && speed < 0.6) {
                this.setVelocity([0, 0]);
                return this.velocity;
            }

            if (this.mass !== 0) { //for acceleration
                result = Vector.multiply(1/this.mass, result);
            }

            result = Vector.multiply(dt, result); //delta velocity
            let vel = Vector.add(result, this.velocity);

            this.setVelocity(vel);
        }
        return this.velocity;
    }

    static getSpeed (array) {
        let speed = 0;
        for (let i = 0; i < array.length; i++) {
            speed = speed + Math.pow(array[i], 2);
        }
        speed = Math.sqrt(speed);
        return speed;
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

    update (dt) {
        this.updatePos(dt);
    }

    getGraphic (u2p) {
        let circle = new createjs.Shape();
        circle.graphics.beginFill("Red").drawCircle(0, 0, 0.4 * u2p);
        circle.layerWeight = 1;
        return circle;
    }

    //Kill entity from global access
    kill () {
        let index = $ENTITIES.indexOf(this);
        if (index > -1) {
            $ENTITIES.splice(index, 1);
        }
    }
}

const $PLAYERS = [];
class Player extends Entity {

    constructor (x, y, mass) {
        super(x, y, mass);
        this.maxSpeed = 70;
        this.u = -10;
        $PLAYERS.push(this);
    }

    getGraphic (u2p) {
        let graphic = new createjs.Container();
        let back = new createjs.Shape();
        back.compositeOperation = 'screen';
        back.graphics.rf(['White', 'DeepSkyBlue', '#000'], [0, 0.1, 1], 0, 0, 0.8 * u2p, 0, 0, 1.5*u2p).dc(0, 0, 1.5*u2p);
        back.alpha = 0.5;
        let front = new createjs.Shape();
        front.graphics.f('White').dc(0, 0, 0.8 * u2p);
        graphic.addChild(back, front);
        graphic.layerWeight = 1;
        return graphic;
    }

    //Kill player from global access
    kill () {
        let index = $ENTITIES.indexOf(this);
        if (index > -1) {
            $ENTITIES.splice(index, 1);
        }
        index = $PLAYERS.indexOf(this);
        if (index > -1) {
            $PLAYERS.splice(index, 1);
        }
    }
}

class Floor extends Entity {

    constructor (x, y, mass) {
        super(x, y, mass);
    }

    getGraphic (u2p) {
        let texture = new Image(100, 100);
        texture.src = 'img/devTexture.jpg';
        let img = new createjs.Bitmap(texture);
        img.scaleX = img.scaleY = (24 * u2p) / 240;
        //let img = new createjs.Shape();
        //img.graphics.f('Black').dr(0, 0, 24 * u2p, 24 * u2p);
        img.layerWeight = 0;
        return img;
    }

}