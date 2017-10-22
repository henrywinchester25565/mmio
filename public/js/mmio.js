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
            $('#canvas').css('display', 'auto');
            console.log("Successfully joined.");
        }
    });

});