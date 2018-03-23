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
const $UUID   = require('uuid/v4');

//PARAMETERS
const $DEFAULT_PARAMS = {
    max_players: 8,
    world_width: 72,
    world_height: 72
};

//GAME STATES
const $GAME_STATE = {
    lobby: 0,
    playing: 1,
    finished: 2
};

//GAME
class Game {

    constructor (args) {
        this.setParameters(args); //this.args <= the games parameters

        this.id = $UUID();
        console.log(this.id, ': NEW LOBBY');

        //PLAYERS
        this.players = [];

        //WORLD
        let worldGen = new $GEN(this.args.world_width, this.args.world_height);
        this.world   = worldGen.generate();
        this.enemies = worldGen.enemies;
        this.spawn   = worldGen.spawn;
        this.exit    = worldGen.exit;

        //FUNCTIONALITY
        this.changed = []; //Entities changed since last update
        this.ai      = false; //Until game properly starts

        let self = this;
        //AI behaviour & gateways
        this.world.onUpdate(function () {
            //If all enemies are dead, open the exit
            if (self.enemies.length <= 0) {
                self.exit.open = true;
            }

            //Get bounds lists
            let plyBounds = [];
            let enemyBounds = [];

            //Players...
            for (let i = 0; i < self.players.length; i++) {
                if (self.players[i].entity.alive) {
                    plyBounds.push(self.players[i].entity); //Since bounds uses entity and entity bounds
                }
            }

            //Enemies...
            for (let i = 0; i < self.enemies.length; i++) {
                let enemy = self.enemies[i];
                //If enemy has follow bounds (static enemies don't)
                if (enemy.follow) {
                    //If enemy is alive in world
                    if (enemy.alive) {
                        enemyBounds.push({ent: enemy, players: [], bounds: enemy.follow}); //So that follow bounds are used
                    }
                    //Cleanup dead enemies from world gen
                    else {
                        let index = self.enemies.indexOf(enemy);
                        if (index > -1) {
                            self.enemies.splice(index, 1);
                        }
                    }
                }
            }

            if (self.exit.open) {
                //Add the exit to enemies
                //The exit test code works pretty much the same as the enemy AI, so self saves some time having to
                //Do collision testing again with all the players
                enemyBounds.push({ent: self.exit, players: [], bounds: self.exit.bounds});
            }

            //Collide player and enemy bounds with enemies as the specific
            let collisions = $BOUNDS.getCollisions(plyBounds, enemyBounds);
            for (let i = 0; i < collisions.length; i++) {
                //Specific from bounds is always index 1 in pairs
                collisions[i][1].players.push(collisions[i][0]);
            }

            //Trigger action event on enemies
            for (let i = 0; i < enemyBounds.length; i++) {
                if (self.ai) {
                    enemyBounds[i].ent.action(enemyBounds[i].players); //Pass collided players as parameter
                }
            }

            //Add new weapons from all players
            for (let i = 0; i < self.enemies.length; i++) {
                let enemy = self.enemies[i];
                //Add new weapons
                while (enemy.weapons.length > 0) {
                    let weapon = enemy.weapons.pop();
                    self.world.addChild(weapon);
                    if (weapon.ai) {
                        self.enemies.push(weapon);
                    }
                }
            }

            //Check how many players are alive
            let alive = 0;
            for (let i = 0; i < self.players.length; i++) {
                //Alive and in game
                if (self.players[i].game === self) {
                    alive++;
                }
                else {
                    //Cleanup dead players
                    setTimeout(function () {
                        if (self.state === $GAME_STATE.running) {
                            let index = self.players.indexOf(self.players[i]); //In case index changes in 3s
                            if (index >= 0) {
                                self.players.splice(index, 1);
                            }
                        }
                    }, 3000);
                }
            }

            //If all dead, stop game
            if (alive <= 0) {
                self.stop();
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

        //GAME STATE
        this.state = $GAME_STATE.lobby;

        //Looks better on console
        console.log('');
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

    queuePlayer (ply, rankings) {
        let index = this.players.indexOf(ply); //If already in game
        if (this.players.length <= this.args.max_players && index === -1) {
            this.players.push(ply);

            ply.game = this;

            ply.generateEntity();

            ply.entity.x = this.spawn.x;
            ply.entity.y = this.spawn.y;

            this.world.queueChild(ply.entity);
        }

        //If max players, start game
        if (this.players.length >= this.args.max_players) {
            this.start();
        }
        //If first player to join, start max waiting period
        else if (this.players.length === 1) {
            let self = this;
            //Wait ten seconds for players to join
            setTimeout(function () {

                //If still in lobby after ten seconds
                if (self.state === $GAME_STATE.lobby) {
                    //Start the game
                    self.start();
                }

            }, 10000);
        }

        //If game is in lobby, send lobby screen
        rankings = rankings || []; //Send top rankings
        if (this.state === $GAME_STATE.lobby) {
            ply.socket.emit('lobby', rankings);
        }
    }

    //Try not to add players after the start of the game
    addPlayer (ply) {
        this.queuePlayer(ply);
        //If added after started
        if (this.state === $GAME_STATE.running && this.players.length <= this.args.max_players) {
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

        //If no players, end game
        if (this.players.length <= 0) {
            this.stop();
        }
    }

    //STARTS THE GAME
    start () {
        console.log(this.id, '> Starting Game');
        this.state = $GAME_STATE.running;
        this.world.start();

        //SEND WORLD TO PLAYERS
        let scrapedWorld = this.world.scrapeAll();
        for (let i = 0; i < this.players.length; i++) {
            let ply = this.players[i];
            ply.socket.emit('world_init', scrapedWorld);
        }

        let self = this;
        //Propel players from spawn, and add to world
        let players = this.players.slice(0);
        players.reverse();
        let propel  = function () {
            let force = $VECTOR.pro(15000*self.players.length, self.spawn.dir);
            let ply = players.pop();
            ply.entity.forces.push(force);
            ply.entity.collides = true;
            ply.active          = true;
            if (players.length > 0) { //Still more players
                setTimeout(propel, 350);
            }
            else {
                self.ai = true;
            }
        };
        propel();

        //Send updates every 50ms
        let updateClients = function () {
            if (self.state === $GAME_STATE.running) {
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
            if (self.state === $GAME_STATE.running) {
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
                                case 'KeyR':
                                    ply.entity.reload();
                                    break;
                                case 'KeyF': //Secondary
                                    ply.entity.attackSecondary(target);
                                    //Add latest weapons to world
                                    if (ply.entity.weapons.length > 0) {
                                        while (ply.entity.weapons.length > 0) {
                                            self.world.addChild(ply.entity.weapons.pop());
                                        }
                                    }
                                    break;
                                case 'Space': //Special attack
                                    ply.entity.attackSpecial(target);
                                    //Add latest weapons to world
                                    if (ply.entity.weapons.length > 0) {
                                        while (ply.entity.weapons.length > 0) {
                                            self.world.addChild(ply.entity.weapons.pop());
                                        }
                                    }
                                    break;
                            }
                        }
                        if (dir.x !== 0 || dir.y !== 0) {
                            dir = $VECTOR.nrm(dir);
                            let force = $VECTOR.pro(2100, dir);

                            ply.entity.forces.push(force);
                        }

                        //MOUSE BTNS
                        for (let j = 0; j < ply.btns.length; j++) {
                            switch (ply.btns[j]) {
                                case 'Mouse0':
                                    ply.entity.attackPrimary(target);
                                    //Add latest weapons to world
                                    if (ply.entity.weapons.length > 0) {
                                        //Adds any new weapons then disposes of them from player references
                                        while (ply.entity.weapons.length > 0) {
                                            self.world.addChild(ply.entity.weapons.pop());
                                        }
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
        console.log(this.id, '> Stopping Game');
        this.state = $GAME_STATE.finished;
        this.world.stop();
    }

}

//EXPORTS
module.exports = Game;
