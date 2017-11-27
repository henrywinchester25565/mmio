//Server-Side ONLY
//DESC: THE GAME SCRIPT
'use strict';

//LOADED
console.log("Loaded: game.js");

//REQUIREMENTS
const $ARRAY = require('./general.js').array;
const $ENTITY = require('./entity.js');
const $EVENTS = require('./events.js').handler();

//FUNCTIONALITY
//Kept separate from constants for simplicity

//Adds an entity to its target game
//Returns true if successful
const _addEntity = function (target, entity) {
    //Is an entity
    if ($ENTITY.isEnt(entity)) {
        target.entities.push(entity);
        target.world.addChild(entity);
        return true;
    }
    return false;
};

//Removes an entity from its target game
//Returns true if successful
const _removeEntity = function (target, entity) {
    //Is an entity
    if ($ENTITY.isEnt(entity)) {
        //Remove from world
        target.removeChild(entity);
        //Splice from entities
        $ARRAY.rmv(target.entities, entity);
        return true;
    }
    return false;
};

//Add a player to the target game
const _addPlayer = function (target, player) {
    //Is a player
    if (player.type === 'player') {
        target.players.push(player);
        return target.addEntity(player);
    }
    return false;
};

//Remove a player from the target game
const _removePlayer = function (target, player) {
    //Is a player
    if (player.type === 'player') {
        $ARRAY.rmv(target.players, player);
        return target.removeEntity(player);
    }
    return false;
};

//Initialise the game
const _init = function (target, clients) {
    target.entities = [];
    target.players = [];
    target.ready = false;
    //TODO
    //SET-UP WORLD
    //ADD CLIENTS AS PLAYERS
    //SEND WORLD TO CLIENTS
    //SET READY
    //If there's an issue along the way, the game will never be ready
    //Can only be played when ready
    target.ready = true;
};

//GAME
//Could make this IE compatible, but I don't like IE. :)
class Game {

    constructor (clients) {
        _init(this, clients);
    }

    //Adds entity to game
    addEntity (entity) {
        _addEntity(this, entity);
    }

    //Removes entity from game
    removeEntity (entity) {
        _removeEntity(this, entity);
    }

    //Adds player to game
    addPlayer (player) {
        _addPlayer(this, player);
    }

    //Removes player from game
    removePlayer (player) {
        _removePlayer(this, player);
    }

    //PLAY GAME
    play () {
        //TODO play game
    }

}

//EXPORTS
exports.game = Game;