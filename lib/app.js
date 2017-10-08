console.log("Loaded: app.js");

const path    = require('path');
const express = require('express');
const app     = express();
const http    = require('http').Server(app);
const io      = require('socket.io')(http);

const root = path.resolve('mmio') + '/';
const port = 25566;

app.use(express.static(root + 'public'));

app.get('/', function(req, res){
	res.sendFile(root + 'public/html/index.html');
});

io.on('connection', function(socket){
    var address = socket.handshake.address;
    console.log(address);
});

http.listen(port, function(){
	console.log('Listening on port: ' + port);
});