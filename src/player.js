//DESC: FOR PLAYER DATA TYPES AND CLASS TYPES
'use strict';

//LOADED
console.log("Loaded: player.js");

//REQUIREMENTS
const $ENTITY = require('./entity.js');

//CLASSES
const $CLASSES = {
    default: {
        type: 'default',
        stats: {
            speed: 1,
            health: 100,
            stamina: 100,
            manna: 100
        }
    }
};

//PLAYER CLASS FOR PLAYER HANDLING
const $PLAYERS = {};
class Player {
    constructor (socket, plyClass) {
        this.type   = 'player';
        this.socket = socket;
        this.id     = socket.id;

        //INPUT
        this.keys = [];
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
                        }

                    }
                }
            }
        });

        //PLAYER DATA
        this.inventory = [];
        this.plyClass = plyClass;
        this.stats = {};
        Object.assign(this.stats, this.plyClass.stats);
        this.xp = 0;

        $PLAYERS[socket.id] = this;
        this.entity = new $ENTITY.ents.ply(2,2);

        this.socket.emit('ply', this.entity.scrape());
    }

    kill () {
        delete $PLAYERS[this.socket.id];
    }
}

//EXPORTS
exports.player  = Player;
exports.players = $PLAYERS;
exports.classes = $CLASSES;
