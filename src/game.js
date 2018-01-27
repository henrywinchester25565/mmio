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
    world_width: 24,
    world_height: 24
};

//GAME
class Game {

    constructor (args) {
        this.setParameters(args); //this.args <= the games parameters
        this.players = [];

        this.world = new $WORLD(this.args.world_width, this.args.world_height);

        this.changed = []; //Entities changed since last update
        
        let self = this;
        this.world.onUpdate(function(changed){
            //console.log('update');
            for (let i = 0; i < changed.length; i++) {
                if (self.changed.indexOf(changed[i]) === -1) {
                    self.changed.push(changed[i]);
                }
            }
        });

        //TEMP
        this.addWalls([
            {x: 0, y:0, w: 1, h: 23},
            {x: 0, y: 0, w: 23, h: 1},
            {x: 23, y: 0, w: 1, h: 23},
            {x: 0, y: 23, w: 23, h: 1},
            {x: 6, y: 6, w: 12, h: 1},
            {x:6, y: 6, w: 1, h: 6}
        ]);
        let light = new $ENTITY.ents.light(3, 3, 0xff0000, 1);
        let light2 = new $ENTITY.ents.light(8, 10, 0xffffff, 2);
        this.world.queueChild(light);
        this.world.queueChild(light2);

        let phys = new $ENTITY.ents.phys(12, 16);
        phys.mass = 1;
        phys.forces.push({x: 1000, y: 1000});
        this.world.queueChild(phys);

        let phys2 = new $ENTITY.ents.phys(12.5, 20);
        phys2.mass = 1;
        phys2.forces.push({x: 0, y: 0});
        //this.world.queueChild(phys2);

        this.running = false;
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
        if (this.running) {
            let scrapedWorld = this.world.scrapeAll();
            ply.socket.emit('world_init', scrapedWorld);
        }
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
        this.running = true;
        this.world.start();

        let scrapedWorld = this.world.scrapeAll();
        for (let i = 0; i < this.players.length; i++) {
            let ply = this.players[i];
            ply.socket.emit('world_init', scrapedWorld);
        }

        //Send updates every 100ms
        let self = this;
        let updateClients = function () {
            if (self.running) {
                let changed = [];
                for (let i = 0; i < self.changed.length; i++) {
                    changed.push(self.changed[i].scrape());
                }
                for (let i = 0; i < self.players.length; i++) {
                    self.players[i].socket.emit('update', changed);
                }
            }
            setTimeout(updateClients, 50);
        };
        //Repeat every 100ms while running
        setTimeout(updateClients, 50);
    }

    stop () {
        console.log('> Stopping Game');
        this.running = false;
        this.world.stop();
    }

}

//EXPORTS
module.exports = Game;