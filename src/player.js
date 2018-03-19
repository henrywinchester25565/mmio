//DESC: FOR PLAYER DATA TYPES AND CLASS TYPES
'use strict';

//LOADED
console.log("Loaded: player.js");

//REQUIREMENTS
const $ENTITY = require('./entity.js');
const $EVENTS = require('./events.js');

//PLAYER STATES
const $PLY_STATE = {
    lobby: 0,
    game: 1
};

//PLAYER CLASS FOR PLAYER HANDLING
class Player {

    constructor (socket, username, plyClass) {
        this.type = 'player';
        this.socket = socket;
        this.id = socket.id;
        this.nick = username;

        this.game   = undefined; //Set when starting a new game
        this.active = false;

        this.events = new $EVENTS.handler();

        this.xp       = 1100;
        this.level    = 1;
        this.oldLevel = 1;

        //INPUT
        this.keys = [];
        this.btns = [];
        this.mouse = {x: 0, y: 0};

        let self = this;
        this.socket.on('input', function (inputs) {
            if (self.active) {
                self.keys = [];
                if (Array.isArray(inputs)) {
                    for (let i = 0; i < inputs.length; i++) {
                        if (typeof inputs[i].type === 'string') {
                            let input = inputs[i];

                            switch (input.type) {
                                case 'key':
                                    if (typeof input.value === 'string') {
                                        self.keys.push(input.value);
                                    }
                                    break;
                                case 'mouse':
                                    if (typeof input.value.x === 'number' && typeof input.value.y === 'number') {
                                        self.mouse.x = input.value.x;
                                        self.mouse.y = input.value.y;
                                    }
                                    break;
                                case 'btn':
                                    if (typeof input.value === 'string') {
                                        self.btns.push(input.value);
                                    }
                                    break;
                            }

                        }
                    }
                }
            }
        });

        //PLAYER DATA
        this.inventory = [];
        this.plyClass = plyClass || 'mage';
        this.stats = {};

        this.entity = undefined; //Created at start of game
    }

    generateEntity () {
        let entity = new $ENTITY.players[this.plyClass](2,2);
        entity.collides = false; //Until made collide OK by game
        this.entity = entity;
        this.entity.nick = this.nick;

        //When entity exits game
        let self = this;
        this.entity.onExit(function () {
            self.xp       = self.xp + self.entity.xp;
            self.oldLevel = self.level;
            self.level    = Math.floor(self.xp/200);
            self.entity   = undefined; //Lose entity connection
            self.active   = false;
            self.exit();
        });

        this.entity.onKill(function () {
            if (self.entity === entity) {
                self.socket.emit('dead');
            }
        });

        //Send player entity to game
        this.socket.emit('ply', this.entity.scrape());
    }

    onExit (func) {
        this.events.on('exit', func);
    }

    exit () {
        this.events.emit('exit');
        this.socket.emit('exit');
    }

}

//EXPORTS
module.exports = Player;
