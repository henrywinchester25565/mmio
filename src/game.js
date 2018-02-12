//Server-Side ONLY
//DESC: THE GAME SCRIPT
'use strict';

//LOADED
console.log("Loaded: game.js");

//REQUIREMENTS
const $ENTITY = require('./entity.js');
const $EVENTS = require('./events.js').handler;
const $WORLD  = require('./world.js');
const $VECTOR = require('./general.js').vector;

//PARAMETERS
const $DEFAULT_PARAMS = {
    max_entities: 50,
    max_players: 12,
    world_width: 24,
    world_height: 48
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
            self.changed = changed;
        });

        //TEMP
        this.addWalls([
            {x: 0, y: 0, w: 23, h: 1},
            {x: 0, y: 1, w: 1, h: 38},
            {x: 0, y: 39, w: 20, h: 1},
            {x: 19, y: 4, w: 1, h: 35},
            {x: 1, y: 4, w: 8, h: 1},
            {x: 9, y: 4, w: 1, h: 10},
            {x: 4, y: 13, w: 5, h: 1},
            {x: 13, y: 4, w: 1, h: 4},
            {x: 14, y: 4, w: 5, h: 1},
            {x: 13, y: 10, w: 1, h: 4},
            {x: 14, y: 13, w: 5, h: 1},
            {x: 20, y: 13, w: 3, h: 1},
            {x: 23, y: 1, w: 1, h: 13},
            {x: 14, y: 7, w: 2, h: 1},
            {x: 4, y: 22, w: 6, h: 1},
            {x: 9, y: 17, w: 1, h: 5},
            {x: 1, y: 26, w: 9, h: 1},
            {x: 10, y: 26, w: 1, h: 10},
            {x: 1, y: 35, w: 2, h: 1},
            {x: 6, y: 35, w: 4, h: 1},
            {x: 11, y: 35, w: 2, h: 1},
            {x: 16, y: 35, w: 3, h: 1}
        ]);

        let l1 = new $ENTITY.ents.light(5, 30, 0x4cb6e8, 1.2, 8);
        let l2 = new $ENTITY.ents.light(15, 22, 0xe51647, 1.8, 30);
        let l3 = new $ENTITY.ents.light(7, 20, 0xe5cc70, 1.2, 10);

        this.world.queueChild(l1);
        this.world.queueChild(l2);
        this.world.queueChild(l3);

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
            this.world.addChild(ply.entity);
        }
    }

    //Try not to add players after the start of the game
    addPlayer (ply) {
        this.queuePlayer(ply);
        if (this.running && this.players.length <= this.args.max_players) {
            let scrapedWorld = this.world.scrapeAll();
            ply.socket.emit('world_init', scrapedWorld);
        }
    }

    killPlayer (ply) {
        this.world.killChild(ply.entity);
        let index = this.players.indexOf(ply);
        if (index > -1) {
            this.players.splice(index, 1);
        }
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

        let self = this;
        //Send updates every 50ms
        let updateClients = function () {
            if (self.running) {
                let changed = [];
                for (let i = 0; i < self.changed.length; i++) {
                    changed.push(self.changed[i].scrape());
                }
                for (let i = 0; i < self.players.length; i++) {
                    self.players[i].socket.emit('update', changed);
                }
                setTimeout(updateClients, 50);
            }
        };
        //Repeat every 50ms while running
        setTimeout(updateClients, 50);
        //update players every 15ms
        let updatePlayer = function () {
            if (self.running) {
                let plys = self.players;
                for (let i = 0; i < plys.length; i++) {
                    let ply = plys[i];

                    //KEYS
                    let dir = {x: 0, y: 0};
                    for (let j = 0; j < ply.keys.length; j++) {
                        switch (ply.keys[j]) {
                            case 'KeyW':
                                dir = $VECTOR.add(dir, {x: 0, y: 1});
                                break;
                            case 'KeyS':
                                dir = $VECTOR.add(dir, {x: 0, y: -1});
                                break;
                            case 'KeyA':
                                dir = $VECTOR.add(dir, {x: -1, y: 0});
                                break;
                            case 'KeyD':
                                dir = $VECTOR.add(dir, {x: 1, y: 0});
                                break;
                        }
                    }
                    if (dir.x !== 0 || dir.y !== 0) {
                        dir = $VECTOR.nrm(dir);
                        let force = $VECTOR.pro(2000, dir);

                        ply.entity.forces.push(force);
                    }

                    //MOUSE
                    if (ply.mouse.x !== 0 && ply.mouse.y !== 0) {
                        let pos = {x: ply.entity.x, y: ply.entity.y};
                        let dir = $VECTOR.add($VECTOR.pro(-1, pos), ply.mouse);
                        dir.x = dir.x * -1; //Not sure why I have to do this
                        //TODO figure out why I have to do above ^^^
                        ply.entity.angle = $VECTOR.ang(dir);
                    }

                }
                setTimeout(updatePlayer, 15);
            }
        };
        setTimeout(updatePlayer, 15);
    }

    stop () {
        console.log('> Stopping Game');
        this.running = false;
        this.world.stop();
    }

}

//EXPORTS
module.exports = Game;