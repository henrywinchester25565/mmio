//DESC: HANDLES ALL TOP-LEVEL Server-Side GAMEPLAY ELEMENTS
'use strict';

console.log('');

//NOTES
//Files should start with an all caps DESC: comment explaining the files purpose.
//CAPS - Used for comments being used as headers
//LOADED - Every file loaded should log its execution
//REQUIREMENTS - Proceeds an constants using the 'require' function.
//$CONSTANT - A $ preceding all caps (separated by _) for constants.
//_function - In some cases constant functions may be written like this, but only if they are intended to be
//          - functions for an object, and can't be used 'stand-alone'.
//Parameters use lowercase and underscores.
//
//Try and keep exported function names in objects to three letters (e.g. rmv, add).
//Unit - One unit is ~ treated like a metre
//
//Server-Side code is written to be easily converted into a working client-side equivalent.
//
//I declare functions as constant variables. They don't get hoisted by I prefer to treat them entirely like objects,
//and it helps when thinking about structure.
//I might change this later on, but I don't think I need to.

//LOADED
console.log("Loaded: app.js");

//REQUIREMENTS
const $PATH     = require('path');
const $EXPRESS  = require('express');
const $APP      = $EXPRESS();
const $HTTP     = require('http').Server($APP);
const $IO       = require('socket.io')($HTTP);
/*
//PARAMETERS
const $ROOT = $PATH.resolve('mmio') + '/';
const $PORT = 25566;

//SERVING FILES
//Static files
$APP.use($EXPRESS.static($ROOT + 'public'));

//Send the index file to any connection
$APP.get('/', function(req, res){
    res.sendFile($ROOT + 'public/html/index.html');
});

////////////////////////////////////////////////////

//GAME
//REQUIREMENTS

const $GAME = require('./game.js');
const $PLAYER = require('./player.js');

console.log('');//Break in console

//Table of games
//Game id, game object relationship
const $GAMES = {};
//TODO ^
let game;

//Table of all players
//Socket id, player object relationship
const $PLAYERS = {};
//List of all taken username's
const $USERNAMES = [];
//Functions to handle (dis)connect
const $PLY_CONNECT = function (socket) {
    console.log('Connection: ' + socket.id);

    if ($USERNAMES.length === 0) {
        game = new $GAME();
        game.start();
    }

    socket.emit('username');
    socket.on('username', function (username) {
        if ($PLAYERS[socket.id] === undefined && $USERNAMES.indexOf(username) === -1) {
            $USERNAMES.push(username);
            //Create player
            let ply = new $PLAYER.player(socket, username, $PLAYER.classes.default);
            $PLAYERS[ply.id] = ply;
            socket.emit('ready');

            //Add to game
            game.addPlayer(ply);
        }
        else {
            socket.emit('username');
        }
    });
};

const $PLY_DISCONNECT = function (socket) {
    console.log('Disconnection: ', socket.id);

    if ($PLAYERS[socket.id] !== undefined) {
        let ply = $PLAYERS[socket.id];
        //Remove player from game
        game.killPlayer(ply);

        //Clear username for others to use
        let index = $USERNAMES.indexOf(ply.nick);
        if (index > -1) {
            $USERNAMES.splice(index, 1);
        }

        //Remove player for players
        delete $PLAYERS[socket.id];
    }
};

console.log('');

$IO.on('connection', function (socket) {
    $PLY_CONNECT(socket);
    socket.on('disconnect', function () {
        $PLY_DISCONNECT(socket);
    });
});


//IMPORTANT: MUST BE LAST
//HTTP listen on $PORT for connections
$HTTP.listen($PORT, function(){
    console.log('Listening on port: ' + $PORT);
});
*/
const gen = require('./worldgen.js');
let world = new gen(72, 72);
world.generate();