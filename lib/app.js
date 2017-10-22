//APP
console.log("Loaded: app.js");

const path     = require('path');
const express  = require('express');
const app      = express();
const http     = require('http').Server(app);
const io       = require('socket.io')(http);

const ROOT = path.resolve('mmio') + '/';
const PORT = 25566;

//DELIVERING FILES
app.use(express.static(ROOT + 'public'));

app.get('/', function(req, res){
	res.sendFile(ROOT + 'public/html/index.html');
});

http.listen(PORT, function(){
	console.log('Listening on port: ' + PORT);
});

//GAME
const MAXCLIENTS = 6;
const MAXPLAYERS = 6;
const $CLIENTS   = [];

const WIDTH  = 12;
const HEIGHT = 12;

const entity = require('./entity.js');
const world  = require('./world.js')(WIDTH, HEIGHT);

for (let i = 0; i < world.chunks.length; i++) {
    for (let j = 0; j < world.chunks[i].length; j++) {
        let flr = new entity.Floor(world.chunks[i][j].x, world.chunks[i][j].y, 0);
        world.addChild(flr);
    }
}

const updateInterval = 10; //ms
function updateWorld() {
    world.update(updateInterval);
}
setInterval(updateWorld, updateInterval);

/*function deliverChunks() {
    //TODO
}*/

/*TODO realised socket.io just sends info as json (as I should have expected). I need to:
    > Restructure so graphics are sent
    > Entities can be reinterpreted to include functionality
    This is going to be tough
 */

//HANDLING CONNECTIONS
//TODO optimise this
io.on('connection', function (socket) {
    let address = socket.handshake.address;
    console.log("Client connected - " + address);

    socket.on('nickname', function (nickname) {
        if ($CLIENTS.length !== MAXCLIENTS) {
            let client = {
                id: this.id,
                nick: nickname,
                player: new entity.Player(42, 42, {mass: 0.8, maxSpeed: 100, u: -5})
            }

            console.log("Initialising player " + client.nick + "...");
            this.emit('init', WIDTH, HEIGHT, world.children, client.player);

            //TODO limit the data sent in this from chunks to just the important stuff (no need to send graphics again for example)
            let updateClient = function () {
                let ply = client.player;
                let chunks = world.getPlayerChunks(ply);
                socket.emit('update', chunks, ply);
            }
            client.update = setInterval(updateClient, 30);//3* slower

            $CLIENTS.push(client);
            console.log("> Player " + client.nick + " has connected.");
            this.broadcast.emit('message', "Player " + client.nick + " has connected.");

            world.addChild(client.player);
            this.emit('joined', true);
        }
        else {this.emit('joined', false);}
    });

    socket.on('disconnect', function () {

        //Pretty bad way of doing this
        //Should try something speedier
        //Although I doubt $CLIENTS will exceed more than 20 in a game.
        for (let i = 0; i < $CLIENTS.length; i++) {
            if ($CLIENTS[i].id === this.id) {
                world.removeChild($CLIENTS[i].player);
                $CLIENTS[i].update.unref();//Stop sending updates to client
                this.broadcast.emit('message', "Player " + $CLIENTS[i].nick + " has disconnected.");
                console.log("> Player " + $CLIENTS[i].nick + " has disconnected.");
                $CLIENTS.splice(i, 1);
            }
        }

        let address = this.handshake.address;
        console.log("Client disconnected - " + address);
    });
});