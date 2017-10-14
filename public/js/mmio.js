//For overall handling
"use strict";

const $CLIENTS = [];
class Client {
    constructor (nickname, ip) {
        this.id = nickname;
        this.ip = ip;
    }
}

const canvas = 'canvas'; //Name of canvas
const socket = io();

const world = new World(12, 6);
let obj = {x: 23, y: 35, test: function () {console.log("my name is jeff")}};
world.addChild(obj);
let content = world.getChunk(obj.x, obj.y).children;
for (let i = 0; i < content.length; i++) {
    content[i].test();
}

const camera = new Camera(world, canvas);