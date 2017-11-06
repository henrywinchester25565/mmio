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

const entity = require('./entity.js');