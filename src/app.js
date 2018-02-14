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

/*________________________________________________________*/

//GAME
//REQUIREMENTS


const $GAME = require('./game.js');
const $PLAYER = require('./player.js');

console.log('');//Break in console

const game = new $GAME();
game.start();

console.log('');

$IO.on('connection', function (socket) {
    console.log('Connection: ' + socket.id);
    let ply = new $PLAYER.player(socket, $PLAYER.classes.default);
    game.addPlayer(ply);
    socket.on('disconnect', function () {
        console.log('Disconnection: ', socket.id);
        game.killPlayer(ply);
        ply.kill();
    });
});


//IMPORTANT: MUST BE LAST
//HTTP listen on $PORT for connections
$HTTP.listen($PORT, function(){
    console.log('Listening on port: ' + $PORT);
});