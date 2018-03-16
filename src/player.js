//DESC: FOR PLAYER DATA TYPES AND CLASS TYPES
'use strict';

//LOADED
console.log("Loaded: player.js");

//REQUIREMENTS
const $ENTITY = require('./entity.js');
const $EVENTS = require('./events.js');

//PLAYER CLASS FOR PLAYER HANDLING
class Player {
    constructor (socket, username, plyClass) {
        this.type = 'player';
        this.socket = socket;
        this.id = socket.id;
        this.nick = username;

        this.game = undefined; //Set when starting a new game

        this.events = new $EVENTS.handler();

        //INPUT
        this.keys = [];
        this.btns = [];
        this.mouse = {x: 0, y: 0};

        let self = this;
        this.socket.on('input', function (inputs) {
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
        });

        //PLAYER DATA
        this.inventory = [];
        this.plyClass = plyClass || 'mage';
        this.stats = {};
        this.xp = 0;

        this.entity = undefined; //Created at start of game
    }

    generateEntity () {
        this.entity = new $ENTITY.players[this.plyClass](2,2);
        this.entity.nick = this.nick;

        //When entity exits game
        let self = this;
        this.entity.onExit(function () {
            self.exit();
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
