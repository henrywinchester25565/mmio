//For overall handling
"use strict";
const socket = io();

/*
const canvas = 'canvas'; //Name of canvas
const cam = new Camera(world, canvas);
cam.target = client.player;
*/

socket.on('message', function(msg) {
    console.log(msg);
});

const client = {
    init: false,
};

//JUST FOR TESTING WILL REDO
$(function () {
    $('#nickname').submit(function () {
        socket.emit('nickname', $('#nick').val());
        return false;
    });
    socket.on('joined', function (success) {
        if (!success) {
            $('#displaytext').text('Unable to join, please try again.');
        }
        else {
            $('#nickname').css('display', 'none');
            $('#canvas').css('display', 'block');
            console.log("Successfully joined.");
        }
    });
    socket.on('init', function (w, h, children, ply) {
        if (!client.init) {
            console.log("Downloading world...");
            client.world = new World(w, h);
            client.world.children = children;

            console.log(children);

            client.player = ply;
            console.log("Creating camera...");
            client.camera = new Camera(client.world, 'canvas');
            client.camera.target = client.player;
        }
    });
    socket.on('update', function (chunks, ply) {
        if (client.init) {
            client.world.updateChunks(chunks);
            client.player = ply;
        }
    });
});