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
class Player {
    constructor (socket, username, plyClass) {
        this.type   = 'player';
        this.socket = socket;
        this.id     = socket.id;
        this.nick   = username;

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
        this.plyClass = plyClass;
        this.stats = {};
        Object.assign(this.stats, this.plyClass.stats);
        this.xp = 0;

        this.entity = new $ENTITY.ents.mage(2,2);

        this.socket.emit('ply', this.entity.scrape());
    }

}

//EXPORTS
exports.player  = Player;
exports.classes = $CLASSES;
