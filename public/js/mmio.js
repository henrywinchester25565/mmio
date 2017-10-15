//For overall handling
"use strict";

const KEYS = {
    w: 87,
    a: 65,
    s: 83,
    d: 68
}

//TODO this whole thing needs a lot of work
const $CLIENTS = [];
class Client {
    constructor (nickname, ip, world, isClient) {
        this.id = nickname;
        this.ip = ip;
        this.player = new Player(world.w/2, world.h/2, 1);
        if (isClient === true) {
            this.camera = new Camera(world, canvas);
            this.camera.target = this.player;
        }
        this.keysdown = [];
        world.addChild(this.player);
    }

    /*let index = self.player.forces.indexOf(self.keyforce);
    if (index !== -1) {
    self.player.forces = self.player.forces.splice(index, 1);
}
self.keyforce =*/


    init () {
        let self = this;

        let ukf = function () {
            self.updateKeyforce();
        }
        createjs.Ticker.addEventListener('tick', ukf);

        $(window).keydown(function (event) {
            if (self.keysdown.indexOf(event.which) === -1) {
                self.keysdown.push(event.which);
                console.log("d" + event.which);
                console.log(self.keysdown);
            }
        });
        $(window).keyup(function (event) {
            let index = self.keysdown.indexOf(event.which);
            if (index !== -1) {
                self.keysdown = self.keysdown.splice(index, 0);
                console.log("u" + event.which);
                console.log(self.keysdown);
            }
        });
    }

    updateKeyforce () {
        let self = this; //TODO this is dumb
        let directions = [];
        for (let i = 0; i < self.keysdown.length; i++) {
            if (self.keysdown[i] === KEYS.w) {
                directions.push([0, -1]);
            }
            else if (self.keysdown[i] === KEYS.a) {
                directions.push([-1, 0]);
            }
            else if (self.keysdown[i] === KEYS.s) {
                directions.push([0, 1]);
            }
            else if (self.keysdown[i] === KEYS.d) {
                directions.push([1, 0]);
            }
        }
        let direction = [0, 0];
        for (let i = 0; i < directions.length; i++) {
            direction = Vector.add(direction, directions[i]);
        }

        if (Math.abs(direction[0]) + Math.abs(direction[1]) === 2) {
            direction = Vector.multiply(1/Math.sqrt(2), direction);
        }
        let force = Vector.multiply(40, direction);

        //TODO find a better way of checking if keys are down
        /*if (force[0] === 0 && force[1] ===0) {
            self.player.u = -5;
        } else {
            self.player.u = 0;
        }*/

        let index = self.player.forces.indexOf(self.keyforce);
        if (index !== -1) {
            self.player.forces = self.player.forces.splice(index, 1);
        }
        self.keyforce = force;
        self.player.forces.push(self.keyforce);
    }
}

const canvas = 'canvas'; //Name of canvas
const socket = io();

const world = new World(12, 6);

//SETUP WORLD TILES
for (let i = 0; i < world.chunks.length; i++) {
    for (let j = 0; j < world.chunks[i].length; j++) {
        let flr = new Floor(world.chunks[i][j].x, world.chunks[i][j].y, 0);
        world.addChild(flr);
    }
}

let ent = new Entity(12, 30, 1.5);
world.addChild(ent);

const client = new Client('client', '::1', world, true);
client.init();