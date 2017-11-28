//Server-Side ONLY
//DESC: THE GAME SCRIPT
'use strict';

//LOADED
console.log("Loaded: game.js");

//REQUIREMENTS
const $ENTITY = require('./entity.js');
const $EVENTS = new require('./events.js').handler();

//GAME
//Could make this IE compatible, but I don't like IE. :)
class Game {

    constructor (clients) {
        this.entities = {};
        this.players = {};
        this.world = undefined;
    }

    init () {
        //TODO
        //SET-UP WORLD
        //ADD CLIENTS AS PLAYERS
        //SEND WORLD TO CLIENTS
        //SET READY
        //If there's an issue along the way, the game will never be ready
    }

    //Adds entity to game
    addEntity (entity) {
        //Is an entity
        if ($ENTITY.isEnt(entity)) {
            this.entities[entity.id] = entity;
            this.world.addChild(entity);
            return true;
        }
        return false;
    }

    //Removes entity from game
    removeEntity (entity) {
        //Is an entity
        if ($ENTITY.isEnt(entity) && entity.id !== undefined) {
            //Remove from world
            this.world.removeChild(entity);
            //Splice from entities
            delete this.entities[entity.id];
            return true;
        }
        return false;
    }

    //Adds player to game
    addPlayer (player) {
        //Is a player
        if (player.type === 'player' && player.id !== undefined) {
            this.players[player.id] = player;
            return this.addEntity(player);
        }
        return false;
    }

    //Removes player from game
    removePlayer (player) {
        //Is a player
        if (player.type === 'player' && player.id !== undefined) {
            delete this.players[player.id];
            return this.removeEntity(player);
        }
        return false;
    }

    //PLAY GAME
    play () {
        //TODO play game
    }

}

//EXPORTS
exports.game = Game;