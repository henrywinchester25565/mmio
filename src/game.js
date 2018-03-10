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
const $GEN    = require('./worldgen.js');
const $BOUNDS = require('./bounds.js');

//PARAMETERS
const $DEFAULT_PARAMS = {
    max_players: 8,
    world_width: 72,
    world_height: 72
};

//GAME
class Game {

    constructor (args) {
        this.setParameters(args); //this.args <= the games parameters
        this.players = [];

        let worldGen = new $GEN(this.args.world_width, this.args.world_height);
        this.world = worldGen.generate();
        this.enemies = worldGen.enemies;
        this.spawn = worldGen.graph.nodes[0].pos;

        this.changed = []; //Entities changed since last update
        
        let self = this;
        //AI behaviour
        this.world.onUpdate(function () {
            //Get bounds lists
            let plyBounds = [];
            let enemyBounds = [];

            //Players...
            for (let i = 0; i < self.players.length; i++) {
                plyBounds.push(self.players[i].entity); //Since bounds uses entity and entity bounds
            }

            //Enemies...
            for (let i = 0; i < self.enemies.length; i++) {
                let enemy = self.enemies[i];
                enemyBounds.push({ent: enemy, players: [], bounds: enemy.follow}); //So that follow bounds are used
            }

            //Collide player and enemy bounds with enemies as the specific
            let collisions = $BOUNDS.getCollisions(plyBounds, enemyBounds);
            for (let i = 0; i < collisions.length; i++) {
                //Specific from bounds is always index 1 in pairs
                collisions[i][1].players.push(collisions[i][0]);
            }

            //Trigger action event on enemies
            for (let i = 0; i < enemyBounds.length; i++) {
                enemyBounds[i].ent.action(enemyBounds[i].players); //Pass collided players as parameter
            }
        });

        //Get changed entities
        this.world.onUpdate(function (changed) {
            //Merge together due to sync issues
            for (let i = 0; i < changed.length; i++) {
                let index = self.changed.indexOf(changed[i]);
                if (index === -1) {
                    self.changed.push(changed[i]);
                }
            }
        });

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
            ply.entity.x = this.spawn.x;
            ply.entity.y = this.spawn.y;
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

    //STARTS THE GAME
    start () {
        console.log('> Starting Game');
        this.running = true;
        this.world.start();

        //SEND WORLD TO PLAYERS
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
                    let ent = self.changed[i];
                    changed.push(ent.scrape());
                }
                for (let i = 0; i < self.players.length; i++) {
                    self.players[i].socket.emit('update', changed);
                }
                self.changed = [];
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

                    //If the player has an entity to update
                    if (ply.entity) {
                        //MOUSE TARGET
                        let target = ply.mouse;
                        if (ply.mouse.x !== 0 && ply.mouse.y !== 0) {
                            //ROTATE
                            let pos = {x: ply.entity.x, y: ply.entity.y};
                            let dir = $VECTOR.add($VECTOR.pro(-1, pos), ply.mouse);
                            dir.x = dir.x * -1; //Not sure why I have to do this
                            ply.entity.angle = $VECTOR.ang(dir);
                        }

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
                            let force = $VECTOR.pro(1300, dir);

                            ply.entity.forces.push(force);
                        }

                        //MOUSE BTNS
                        for (let j = 0; j < ply.btns.length; j++) {
                            switch (ply.btns[j]) {
                                case 'Mouse0':
                                    ply.entity.attackPrimary(target);
                                    //Add latest weapon to world
                                    if (ply.entity.weapons.length > 0) {
                                        self.world.addChild(ply.entity.weapons[ply.entity.weapons.length - 1]);
                                    }
                                    break;
                            }
                        }
                    }
                    //Reset btns so no 'double tap' due to fast update time
                    ply.btns = [];
                }
                setTimeout(updatePlayer, 15);
            }
        };
        setTimeout(updatePlayer, 15);
    }

    //STOPS (PAUSES) THE GAME
    stop () {
        console.log('> Stopping Game');
        this.running = false;
        this.world.stop();
    }

}

//EXPORTS
module.exports = Game;