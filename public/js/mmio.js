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
            }
        });
        $(window).keyup(function (event) {
            let index = self.keysdown.indexOf(event.which);
            if (index !== -1) {
                self.keysdown = self.keysdown.splice(index + 1, 1); //+1 makes no sense, but that's just how it's working
                //TODO look into why it's +1, could cause issues down the line
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
        let force = Vector.multiply(80, direction);

        let index = self.player.forces.indexOf(self.keyforce);
        if (index !== -1) {
            self.player.forces = self.player.forces.splice(index, 1); //No +1 here; weird
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