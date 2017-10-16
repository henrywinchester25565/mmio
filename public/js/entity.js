"use strict";

const $ENTITIES = [];

//TODO collisions
class collisionLine {
    constructor (pointA, pointB, blocksLight) {
        this.a = pointA;
        this.b = pointB;
        if (typeof blocksLight === 'undefined') {this.blockLight = true;}
    }
}

class collisionPoly {

}

class collisionCircle {
    constructor (x, y, blocksLight) {
        this.a = pointA;
        this.b = pointB;
        if (typeof blocksLight === 'undefined') {this.blockLight = true;}
    }
}

class Entity {
    constructor (x, y) {
        this.x = x;
        this.y = y;
        $ENTITIES.push(this);
    }

    //remove ent from global access
    kill () {
        let index = $ENTITIES.indexOf(this);
        if (index !== -1) {
            $ENTITIES.splice(index, 1);
        }
    }

    set graphic (handler) {
        this.graphicHandler = handler;
    }
    get graphic () {
        return this.graphicHandler;
    }
    getGraphic (u2p) {
        if (typeof this.graphic !== 'undefined') {
            return this.graphic(u2p);
        }
        else {
            let shape = new createjs.Shape();
            shape.graphics.f('Black').dc(0,0,0.1*u2p);
            return shape;
        }
    }

    update () {
        //NOTHING
    }

}

class Light {
    //TODO
}

class PhysObj extends Entity {
    //has a world variable
    //x and y in position
    constructor (x, y, info) {
        super(x, y);
        info = typeof info !== 'undefined' ? info : {mass: 1, maxSpeed: 100, u: -5};
        this.maxSpeed = info.maxSpeed;
        this.mass = info.mass; //mass of warrior = 1

        //for calculating velocity
        this.forces = [];
        this.u = info.u; //coefficient of friction
    }

    set velocity (value) {
        if (typeof value === 'number') {this._velocity = {x: value, y: value};}
        else {this._velocity = value;}
    }
    get velocity () {
        return this._velocity;
    }

    //dt is delta time
    //TODO change name to something more suitable, or use _velocity inside instead, replacing this with get above
    getVelocity (dt) {
        if (typeof this.velocity === 'undefined') {this.velocity = {x: 0, y: 0};}

        let speed = Vector.mag(this.velocity);

        if (this.forces.length === 0) {this.forces.push({x: 0, y: 0})}
        let result = this.forces[0];

        for (let i = 1; i < this.forces.length; i++) {
            result = Vector.add(result, this.forces[i]); //Not imported
        }

        //Drag limits speed to max speed
        let max = this.maxSpeed !== 0 ? this.maxSpeed : 1
        let drag = Vector.multiply(-1 * (speed/max), result);
        result = Vector.add(result, drag);

        //Friction to gently decrease speed
        let direction = Vector.dir(this.velocity);
        let friction = Vector.multiply(this.mass * 10 * this.u, direction);
        result = speed > 0.4 ? Vector.add(result, friction) : result;

        //Stop velocity entirely if low enough
        if (result.x === 0 && result.y === 0 && speed < 0.6) {
            this.velocity = {x: 0, y: 0};
            return this.velocity;
        }

        //for a; things with mass 0 shouldn't be able to move but eh whatever
        if (this.mass !== 0) { //for acceleration
            result = Vector.multiply(1/this.mass, result);
        }

        //velocity
        result = Vector.multiply(dt, result); //delta velocity
        let vel = Vector.add(result, this.velocity);

        this.velocity = vel;
        return this.velocity;
    }

    //dt is delta time
    updatePos (dt) {
        let pos = {};
        pos.x = this.x; pos.y = this.y;
        let dp = Vector.multiply(dt, this.getVelocity(dt)); //Change in position by product of dt and velocity (update velocity at same time)
        pos = Vector.add(pos, dp);
        this.x = pos.x;
        this.y = pos.y;
    }

    update (dt) {
        this.updatePos(dt);
        if (typeof this.controller !== 'undefined') {
            this.controller.update(dt);
        }
    }
}

//Interface kinda
class Controller {
    constructor (physObj) {
        this.physObj = physObj;
        //updateHandler is undefined until accessed
    }

    set update (handler) {
        this.updateHandler = handler;
    }
    get update () {
        return this.updateHandler;
    }
    update (dt) {
        if (typeof this.updateHandler !== 'undefined') {
            this.updateHandler(ent, dt);
        }
    }
}

//For controlling players; mapping keys to actions
class PlayerController extends Controller {
    constructor (physObj) {
        super (physObj);
        this.force = 200; //force exerted on object
        this.keysdown = [];
        this.initKeys();
    }

    initKeys () {
        let self = this;
        document.addEventListener('keydown', function(event) {
            if (self.keysdown.indexOf(event.key) === -1) {
                self.keysdown.push(event.key);
            }
        }, false);
        document.addEventListener('keyup', function(event) {
            let index = self.keysdown.indexOf(event.key);
            if (index !== -1) {
                self.keysdown.splice(index, 1);
            }
        }, false);
    }

    update () {
        //let self = this; //TODO this is dumb
        let directions = [];
        for (let i = 0; i < this.keysdown.length; i++) {
            if (this.keysdown[i] === KEYS.w) {
                directions.push({x: 0, y: -1});
            }
            else if (this.keysdown[i] === KEYS.a) {
                directions.push({x: -1, y: 0});
            }
            else if (this.keysdown[i] === KEYS.s) {
                directions.push({x: 0, y: 1});
            }
            else if (this.keysdown[i] === KEYS.d) {
                directions.push({x: 1, y: 0});
            }
            else if (this.keysdown[i] === KEYS.space) {
                world.dtx = 0.5;
            }
        }
        let direction = {x: 0, y: 0};
        for (let i = 0; i < directions.length; i++) {
            direction = Vector.add(direction, directions[i]);
        }

        if (Math.abs(direction.x) + Math.abs(direction.y) === 2) {
            direction = Vector.multiply(1/Math.sqrt(2), direction);
        }
        let force = Vector.multiply(this.force, direction);

        let index = this.physObj.forces.indexOf(this.keyforce);
        if (index !== -1) {
            this.physObj.forces.splice(index, 1);
        }
        this.keyforce = force;
        this.physObj.forces.push(this.keyforce);
    }
}

class BotController {

    //TODO

}

class Character extends PhysObj {

    //TODO
    //Manipulated by controllers
    constructor (x, y, info) {
        super(x, y, info);
    }

}

const $PLAYERS = [];
class Player extends Character {

    //Should think of a way around mass twice...
    constructor (x, y, playerClass) {
        super(x, y, playerClass);
        this.pc = playerClass;
        $PLAYERS.push(this);

        this.graphic = function (u2p) {
            let graphic = new createjs.Container();
            let back = new createjs.Shape();
            back.compositeOperation = 'screen';
            back.graphics.rf(['white', 'deepskyblue', '#000'], [0, 0.1, 1], 0, 0, 0.8 * u2p, 0, 0, 1.5*u2p).dc(0, 0, 1.5*u2p);
            back.alpha = 0.5;
            let front = new createjs.Shape();
            front.graphics.f('white').dc(0, 0, 0.8 * u2p);
            graphic.addChild(back, front);
            graphic.layerWeight = 2;
            return graphic;
        }
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

    constructor (x, y) {
        super(x, y);
        this.graphic = function (u2p) {
            let texture = new Image(100, 100);
            texture.src = 'img/devTexture.jpg';
            let img = new createjs.Bitmap(texture);
            img.scaleX = img.scaleY = (24 * u2p) / 240;
            img.layerWeight = 0;
            return img;
        }
    }
}