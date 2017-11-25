'use strict';
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
/*app.use(express.static(ROOT + 'public'));

app.get('/', function(req, res){
    res.sendFile(ROOT + 'public/html/index.html');
});

http.listen(PORT, function(){
    console.log('Listening on port: ' + PORT);
});*/

const $ENTITY = require('./entity').$ENTITY;
const $VECTOR = require('./general').$VECTOR;

//WORLD GEN ALGORITHM TESTING
//Storing all the points in the array like this means I can change points through the
//edge and have them change for all the edges, because the reference is to the array,
//not the edge
const $POINTS = [];
const $EDGES = [];
class Edge {
    constructor (start, end) {
        this.start = start;
        this.end = end;
    }

    subdivide (percentage) {
        percentage = percentage % 1;
        let x = Math.floor(percentage*(this.end.x - this.start.x));
        let y = Math.floor(percentage*(this.end.y - this.start.y));
        $POINTS.push({x: x + this.start.x, y: y + this.start.y});

        let newEdge = new Edge($POINTS[$POINTS.length - 1], this.end);
        $EDGES.push(newEdge);

        this.end = $POINTS[$POINTS.length - 1];
        return $EDGES[$EDGES.length - 1];
    }

    translate (x, y) {
        this.start.x = this.start.x + x;
        this.start.y = this.start.y + y;
        console.log(this.start);
        this.end.x = this.end.x + x;
        this.end.y = this.end.y + y;
        return this;
    }

    extend (x, y, percentage) {
        //percentage = $VECTOR.mag($VECTOR.add(this.end, $VECTOR.pro(this.start, -1))) * percentage > 4 ? percentage : 0.5;
        return this.subdivide(percentage).subdivide(0).translate(x, y);
    }
}

//PARAMS
const $SIZE = 25;
const $EDGE_COMPLEXITY = 10; //2n+1
const $GAP = '###';
const $LINE = '   ';

const $WORLD = [];
for (let x = 0; x < $SIZE; x++) {
    let row = [];
    for (let y = 0; y < $SIZE; y++) {
        row[y] = Math.floor(Math.random() * 10000);
    }
    $WORLD.push(row);
}

let $DISPLAY = [];
const $INIT_DISP = function () {
    $DISPLAY.splice(0, $SIZE);
    for (let y = 0; y < $SIZE; y++) {
        let row = [];
        for (let x = 0; x < $SIZE; x++) {
            row[x] = $GAP;
        }
        $DISPLAY.push(row);
    }
}

const $UPDATE_DISPLAY = function () {
    for (let i = 0; i < $EDGES.length; i++) {
        let xDist = $EDGES[i].end.x - $EDGES[i].start.x;
        let yDist = $EDGES[i].end.y - $EDGES[i].start.y;
        let xM = yDist / xDist;
        let yM = xDist / yDist;

        let xC = 1;
        if (xDist < 0) {xC = -1;}
        let yC = 1;
        if (yDist < 0) {yC = -1;}

        xDist = Math.abs(xDist);
        yDist = Math.abs(yDist);

        if (xDist > 0) {
            for (let x = 0; x <= xDist; x++) {
                let xN = x * xC;
                let y = Math.floor(xN * xM);
                if ($IN_DISPLAY(xN + $EDGES[i].start.x, y + $EDGES[i].start.y)) {
                    $DISPLAY[xN + $EDGES[i].start.x][y + $EDGES[i].start.y] = $LINE;
                }
            }
        }
        if (yDist > 0) {
            for (let y = 0; y <= yDist; y++) {
                let yN = y * yC;
                let x = Math.floor(yN * yM);
                if ($IN_DISPLAY(x + $EDGES[i].start.x, yN + $EDGES[i].start.y)) {
                    $DISPLAY[x + $EDGES[i].start.x][yN + $EDGES[i].start.y] = $LINE;
                }
            }
        }
    }
    for (let i = 0; i < $POINTS.length; i++) {
        $DISPLAY[$POINTS[i].x][$POINTS[i].y] = ' x ';
    }
}

const $IN_DISPLAY = function (x, y) {
    return x >= 0 && x < $SIZE && y >= 0 && y < $SIZE;
}

const $PRINT = function () {
    console.info(' --- DISPLAY --- ');
    let border = '';
    for (let i = 0; i < $SIZE+2; i++) {
        border = border.concat('###');
    }
    //console.log(border);
    for (let y = 0; y < $SIZE; y++) {
        let disp = '';
        for (let x = 0; x < $SIZE; x++) {
            disp = disp.concat($DISPLAY[x][y]);
        }
        console.log(disp);
    }
    //console.log(border);
}

let start = {x: 0, y: Math.floor($SIZE - 4)};
let end = {x: $SIZE - 1, y: Math.floor($SIZE - 4)}
$POINTS.push(start, end);

$EDGES.push(new Edge($POINTS[0], $POINTS[1]));

/*$EDGES[0].extend(0, -10, 0.5);

$EDGES[1].extend(-4, 0, 0.7);
console.log($EDGES);

$INIT_DISP();
$UPDATE_DISPLAY()
$PRINT();*/

let edges = 0;
while (edges < $EDGE_COMPLEXITY) {
    $INIT_DISP();
    $UPDATE_DISPLAY()
    $PRINT();

    let index = Math.floor(Math.random() * $EDGES.length);
    if (index >= $EDGES.length) {index = $EDGES.length - 1}
    //console.log(index, $EDGES.length);
    let edge = $EDGES[index];

    let s = Math.random() > 0.5 ? 1 : -1;//Sign, for direction
    let a = 0;
    let b = 0;
    if (Math.abs(edge.end.x - edge.start.x) > 0) {
        let dis = s > 0 ? $SIZE - edge.start.y : edge.start.y;
        b = Math.floor(Math.random() * dis * s);
        b = Math.abs(b) > 2 ? b : 3 * s;
    }
    else {
        let dis = s > 0 ? $SIZE - edge.start.x : edge.start.x;
        a = Math.floor(Math.random() * dis * s);
        a = Math.abs(a) > 2 ? a : 3 * s;
    }
    console.log('edge: ', edge, 'a: ', a, 'b: ', b);
    console.log('exte: ', edge.extend(a, b, 0.5));
    console.log('edge: ', edge);
    console.log($POINTS);
    edges++;
}

$INIT_DISP();
$UPDATE_DISPLAY();
$PRINT();