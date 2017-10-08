var w;
var h;
const canvas = $('#canvas');

drawCanvas = function () {
    w = window.innerWidth;
    h = window.innerHeight;
    canvas.attr('width', w);
    canvas.attr('height', h);
}

drawCanvas();
console.log('Set initial canvas width to ' + w + ' and height to ' + h);

$( window ).resize(drawCanvas);

const socket = io();

