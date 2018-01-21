//Server-Side ONLY
//DESC: THE GAME SCRIPT
'use strict';

//LOADED
console.log("Loaded: game.js");

//REQUIREMENTS
const $ENTITY = require('./entity.js');
const $EVENTS = require('./events.js').handler;
const $WORLD  = require('./world.js');

//PARAMETERS
const $DEFAULT_PARAMS = {
    max_entities: 50,
    max_players: 12,
    world_width: 144,
    world_height: 144
};

//GAME
class Game {

    constructor (args) {
        this.setParameters(args); //this.args <= the games parameters
        this.players = [];
        this.world = new $WORLD(this.args.world_width, this.args.world_height);
        //TEMP
        this.addWalls([
            {x: 0, y:0, w: 24, h: 1}
        ]);
        this.start();
    }

    //Used to update specific parameters
    setParameters (args) {
        if (args === undefined) {
            this.args = $DEFAULT_PARAMS;
        }
        else {
            for (let param in $DEFAULT_PARAMS) {
                if (!(param in args)) {
                    args[param] = $DEFAULT_PARAMS[param];
                }
            }
            this.args = args;
        }
    }

    queuePlayer (ply) {
        let index = this.players.indexOf(ply); //If already in game
        if (this.players.length <= this.args.max_players && index === -1) {
            this.players.push(ply);
        }
    }

    //Try not to add players after the start of the game
    addPlayer (ply) {
        this.queuePlayer(ply);
        let scrapedWorld = this.world.scrapeAll();
        ply.socket.emit('world_init', scrapedWorld);
    }

    killPlayer (ply) {
        //TODO
    }

    addWalls (walls) {
        for (let i = 0; i < walls.length; i++) {
            let bp = walls[i]; //blueprint
            let wall = new $ENTITY.ents.wall(bp.x, bp.y, bp.w, bp.h);
            this.world.queueChild(wall);
        }
    }

    start () {
        console.log('> Starting Game');
        this.world.start();

        let scrapedWorld = this.world.scrapeAll();
        for (let i = 0; i < this.players.length; i++) {
            let ply = this.players[i];
            ply.socket.emit('world_init', scrapedWorld);
        }

    }

}

//EXPORTS
module.exports = Game;