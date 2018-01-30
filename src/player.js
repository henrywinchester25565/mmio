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
            mana: 100
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

        this.keys = [];
        let self = this;
        this.socket.on('input', function (keys) {;
            self.keys = keys;
        });

        this.inventory = [];
        this.plyClass = plyClass;
        this.stats = {};
        Object.assign(this.stats, this.plyClass.stats);
        this.xp = 0;

        $PLAYERS[socket.id] = this;
        this.entity = new $ENTITY.ents.phys(5,5);
        this.entity.wallBounce = false;

        this.socket.emit('plyid', this.entity.id);
    }

    kill () {
        delete $PLAYERS[this.socket.id];
    }
}

//EXPORTS
exports.player  = Player;
exports.players = $PLAYERS;
exports.classes = $CLASSES;
