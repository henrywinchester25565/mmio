//For overall handling
"use strict";
const socket = io();

//TODO this thing needs a lot of work
const KEYS = {
    w: 'w',
    a: 'a',
    s: 's',
    d: 'd',
    space: ' '
}

const $CLIENTS = [];
class Client {
    constructor (x, y, nickname, ip, isClient) {
        this.nickname = nickname;
        this.ip = ip;
        if (typeof this.isClient === 'undefined') {this.isClient = false;}
        this.isClient = isClient;
    }

    //for setting players
    set player (player) {
        this._player = player;
        if (this.isClient) {
            this.controller = new PlayerController(this._player);
            this._player.controller = this.controller;
        }
    }
    get player () {
        return this._player;
    }
}

const world = new World(12, 6);
//SETUP WORLD TILES
for (let i = 0; i < world.chunks.length; i++) {
    for (let j = 0; j < world.chunks[i].length; j++) {
        let flr = new Floor(world.chunks[i][j].x, world.chunks[i][j].y, 0);
        world.addChild(flr);
    }
}

const client = new Client(10, 10, 'client', '::1', true);
client.player = new Player (10, 10, {mass: 1, maxSpeed: 100, u: -10});
world.addChild(client.player);

const ent = new PhysObj(10, 20, {mass: 1, maxSpeed: 100, u: 0});
ent.controller = new Controller(ent); //feels really weird doing it like this //todo make this better
ent.graphic = function (u2p) {
    let graphic = new createjs.Container();
    let back = new createjs.Shape();
    back.compositeOperation = 'screen';
    back.graphics.rf(['black', 'crimson', '#000'], [0, 0.1, 1], 0, 0, 0.8 * u2p, 0, 0, 1.5*u2p).dc(0, 0, 1.5*u2p);
    back.alpha = 0.5;
    let front = new createjs.Shape();
    front.graphics.f('black').dc(0, 0, 0.8 * u2p);
    graphic.addChild(back, front);
    graphic.layerWeight = 1;
    return graphic;
}
ent.velocity = {x: 20, y: 0};
ent.forces.push({x: 10, y: 0});
ent.controller.update = function () {
    if (this.physObj.x > Chunk.units * 3) {
        this.physObj.forces = [{x: -20, y: 0}];
    }
}
world.addChild(ent);

const canvas = 'canvas'; //Name of canvas
const cam = new Camera(world, canvas);
cam.target = client.player;