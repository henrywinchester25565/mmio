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

/*
   _____          __  __ ______
  / ____|   /\   |  \/  |  ____|
 | |  __   /  \  | \  / | |__
 | | |_ | / /\ \ | |\/| |  __|
 | |__| |/ ____ \| |  | | |____
  \_____/_/    \_\_|  |_|______|
 */

//REQUIREMENTS

const $GAME = require('./game.js');
const $PLAYER = require('./player.js');

console.log('');//Break in console

//Table of all players
//Socket id, player object relationship
const $PLAYERS = {};
const $RANKING = {};

//Game to add players to
let game = new $GAME();

//List of all taken username's
const $USERNAMES = [];

/*
  __  __       _______ _____ _    _ __  __          _  _______ _   _  _____
 |  \/  |   /\|__   __/ ____| |  | |  \/  |   /\   | |/ /_   _| \ | |/ ____|
 | \  / |  /  \  | | | |    | |__| | \  / |  /  \  | ' /  | | |  \| | |  __
 | |\/| | / /\ \ | | | |    |  __  | |\/| | / /\ \ |  <   | | | . ` | | |_ |
 | |  | |/ ____ \| | | |____| |  | | |  | |/ ____ \| . \ _| |_| |\  | |__| |
 |_|  |_/_/    \_\_|  \_____|_|  |_|_|  |_/_/    \_\_|\_\_____|_| \_|\_____|
 */

//Handle those waiting in lobby
const $ADD_TO_LOBBY = function (ply) {
    //PLAYER RANK
    //Remove from old rank
    let oldRank = ply.level - 1;
    if (oldRank > 0) {
        //Delete from old rank
        let index = $RANKING[oldRank].indexOf(ply);
        if (index > -1) {
            $RANKING[oldRank].splice(index, 1); //Remove

            //If ranking now empty, delete it
            if ($RANKING[oldRank].length <= 0) {
                delete $RANKING[oldRank];
            }

        }
    }

    //Add to new rank
    if ($RANKING[ply.level] === undefined) { //Doesn't exist yet
        $RANKING[ply.level] = [];
    }
    if ($RANKING[ply.level].indexOf(ply) < 0) { //Player not in yet
        $RANKING[ply.level].push(ply);
    }

    //GET TOP PLAYERS
    let topRank = 0;
    for (let rank in $RANKING) {
        if ($RANKING.hasOwnProperty(rank)) {
            topRank = rank > topRank ? rank : topRank;
        }
    }

    //Top players
    let players = [];
    while (topRank > 0 && players.length < 5) {
        let rank = topRank;
        if ($RANKING.hasOwnProperty(rank)) {
            let i = 0;
            let player = undefined;
            //Go through players of that rank and add to list if not in already
            while (player === undefined && i < $RANKING[rank].length) {
                let next = $RANKING[rank][i];
                if (players.indexOf(next) === -1) { //New player for top players list
                    player = next;
                }
                i++
            }
            if (player !== undefined) {
                players.push(player);
            }
            //Run out of players at this rank, go down
            else {
                topRank--;
            }
        }
        //Go down rank until find a rank with players
        else {
            topRank--;
        }
    }

    //Refine players list into a list of strings
    let rankings = [];
    for (let i = 0; i < players.length; i++) {
        rankings.push(players[i].nick + ', lvl: ' + players[i].level);
    }

    //IF NO LOBBY
    if (game.state !== 0) {
        game = new $GAME();
    }
    game.queuePlayer(ply, rankings);
};

//Functions to handle (dis)connect
const $PLY_CONNECT = function (socket) {
    console.log('Connection: ' + socket.id);

    socket.emit('username', $USERNAMES.length);
    let handleUsername = function (username) {
        if (typeof username === 'string') {
            username = username.substring(0, 14);
            if ($PLAYERS[socket.id] === undefined && $USERNAMES.indexOf(username) === -1) {
                //Stop listening for username's after good one
                socket.removeListener('username', handleUsername);

                $USERNAMES.push(username);
                socket.emit('username_ok'); //Username is good
                //Create player
                let ply = new $PLAYER(socket, username);
                $PLAYERS[ply.id] = ply;

                //Add player to lobby when made to exit from game
                ply.onExit(function () {
                    $ADD_TO_LOBBY(ply);
                });

                $ADD_TO_LOBBY(ply);
            }
            else {
                socket.emit('username_bad'); //Username not good
            }
        }
        else{
            socket.emit('username_bad'); //Username not even a string
        }
    };
    socket.on('username', handleUsername);
};

const $PLY_DISCONNECT = function (socket) {
    console.log('Disconnection: ', socket.id);

    if ($PLAYERS[socket.id] !== undefined) {
        let ply = $PLAYERS[socket.id];
        //Remove player from game
        if (ply.game) {
            ply.game.killPlayer(ply);
        }

        //Remove from rankings
        let rank = ply.level;
        for (let i = rank; i > 0 && i > rank-2; i--) { //Check rank below too
            if ($RANKING.hasOwnProperty(i)) {
                let index = $RANKING[i].indexOf(ply);
                if (index > -1) {
                    $RANKING[i].splice(index, 1);

                    //If none left in i delete i
                    if ($RANKING[i].length <= 0) {
                        delete $RANKING[i];
                    }
                }
            }
        }

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