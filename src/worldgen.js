//REQUIREMENTS
const $VECTOR = require('./general.js').vector;

//NODE
class Node {

    constructor (pos) {
        this.pos = pos;
        this.edges = [];
    }

    addEdge (edge) {
        this.edges.push(edge);
    }

    removeEdge (edge) {
        let index = this.edges.indexOf(edge);
        if (index > -1) {
            this.edges.splice(index, 1);
        }
    }

}

//EDGE
//Connects nodes, and has weight
class Edge {

    constructor (start, end, weight) {
        this.nodes = [start, end];
        start.addEdge(this);
        end.addEdge(this);
        this.weight = weight;
    }

    contains (start, end) {
        return this.nodes.contains(start) && this.nodes.contains(end);
    }

    traverse (node) {
        let index = this.nodes.indexOf(node) === 0 ? 1 : 0;
        return this.nodes[index];
    }

    split () {
        for (let i = 0; i < this.nodes.length; i++) {
            this.nodes[i].removeEdge(this);
        }
    }

}

//GRAPH
//For multiple nodes
class Graph {

    constructor () {
        this.nodes = [];
        this.edges = [];
    }

    addNode (node) {
        this.nodes.push(node);
        this.current = node; //Current node
    }

    removeNode (node) {
        let index = this.nodes.indexOf(node);
        if (index > -1) {
            //Remove connections
            for (let i = 0; i < node.edges.length; i++) {
                this.removeEdge(node.edges[i]);
            }
            this.nodes.splice(index, 1);
            this.current = this.current === node ? this.nodes[this.nodes.length-1] : this.current;
        }
    }

    addEdge (edge) {
        this.edges.push(edge);
    }

    removeEdge (edge) {
        let index = this.edges.indexOf(edge);
        if (index > -1) {
            this.edges.splice[edge];
            edge.split();
        }
    }

    back () {
        if (this.nodes.length > 0) {
            this.removeNode(this.current);
        }
    }

    //Attaches latest node to current node
    link (node, weight) {
        let edge = new Edge (this.current, node, weight);
        this.addEdge(edge);
    }

    //Links node, and adds to graph as current node
    line (node, weight) {
        this.link(node, weight);
        this.addNode(node);
    }

    //Returns closest node to position vector
    closest (pos) {
        let min  = Number.MAX_VALUE; //Minimum distance
        let node; //Closest node
        for (let i = 0; i < this.nodes.length; i++) {
            let cur = this.nodes[i];
            let dir = $VECTOR.add($VECTOR.pro(-1, pos), cur);
            let dist = $VECTOR.mag(dir);
            if (min > dist) {
                min = dist;
                node = cur;
            }
        }
        return node;
    }

}

//WORLD CANVAS
//For painting
class WorldCanvas {

    constructor (w, h, base) {
        this.w = w;
        this.h = h;
        this.base = base;

        this.clearCanvas();
    }

    clearCanvas () {
        let canvas = [];
        let w = this.w;
        let h = this.h;
        for (let x = 0; x < w; x++) {
            let col = [];
            for (let y = 0; y < h; y++) {
                col[y] = this.base;
            }
            canvas[x] = col;
        }
        this.canvas = canvas;
    }

    inCanvas (pos) {
        return pos.x >= 0 && pos.x < this.w && pos.y >= 0 && pos.y < this.h;
    }

    setValue (pos, value) {
        if (this.inCanvas(pos)) {
            this.canvas[pos.x][pos.y] = value;
        }
    }

    paint (pos, value, radius) {
        let canvas = this.canvas;

        for (let x = pos.x-radius; x <= pos.x+radius; x++) {
            for (let y = pos.y-radius; y <= pos.y+radius;y++) {
                this.setValue({x: x, y: y}, value)
            }
        }
    }

    //Draws line
    line (start, end, value, radius) {
        let canvas = this.canvas;

        //For direction of lines
        let minX = start.x < end.x ? start.x : end.x;
        let maxX = start.x > end.x ? start.x : end.x;
        let minY = start.y < end.y ? start.y : end.y;
        let maxY = start.y > end.y ? start.y : end.y;

        //Paint x values
        let mx = (end.y - start.y) / (end.x - start.x);

        for (let x = minX; x <= maxX; x++) {
            let y = start.y + mx*(x - start.x);
            y = Math.round(y);

            this.paint({x: x, y: y}, value, radius);
        }

        //Paint y values
        let my = (end.x - start.x) / (end.y - start.y);

        for (let y = minY; y <= maxY; y++) {
            let x = start.x + my*(y - start.y);
            x = Math.round(x);

            this.paint({x: x, y: y}, value, radius);
        }

    }

    print () {
        let canvas = this.canvas;

        for (let y = 0; y < this.h; y++) {
            let row = '';
            for (let x = 0; x < this.w; x++) {
                row = row.concat(canvas[x][y] + ' ');
            }
            console.log(row);
        }
    }

}

//PAINT
//Values representing different entities
const $PAINT = {
    void: ' ',
    path: 1,
    wall: 2,
};

//CARDINAL DIRECTIONS
const $DIR = {
    n: {x:  0, y:  1},
    s: {x:  0, y: -1},
    e: {x:  1, y:  0},
    w: {x: -1, y:  0}
};

//WORLD GEN
class WorldGen {

    constructor (w, h, min, max, edg) {
        this.w = w;
        this.h = h;
        this.graph = new Graph();
        this.canvas = new WorldCanvas(w, h, $PAINT.void);

        this.minLength = min || 3;
        this.maxLength = max || 9;
        this.minEdges  = edg || 50;
    }

    drawGraph (value) {
        let canvas = this.canvas;
        canvas.clearCanvas();

        let edges = this.graph.edges;
        for (let i = 0; i < edges.length; i++) {
            let edge = edges[i];
            let start = edge.nodes[0];
            let end = edge.nodes[1];

            canvas.line(start.pos, end.pos, value, edge.weight);
        }
    }

    //Checks minimum number of clear spaces
    minAhead (pos, dir, radius) {
        let start = dir.x === 0 ? pos.x : pos.y;

        let dist = Math.max(this.w, this.h);
        for (let l = 0; l < dist; l++) {
            pos = $VECTOR.add(pos, dir);

            if (!this.canvas.inCanvas(pos)) {
                return l;
            }

            for (let i = start - radius; i <= start + radius; i++) {
                if (dir.x === 0) {
                    if (!this.canvas.inCanvas({x: i, y: pos.y})) {return l;}
                    if (this.canvas.canvas[i][pos.y] !== $PAINT.void) {return l;}
                }
                else if (dir.y === 0) {
                    if (!this.canvas.inCanvas({x: pos.x, y: i})) {return l;}
                    if (this.canvas.canvas[pos.x][i] !== $PAINT.void) {return l;}
                }
            }
        }
    }

    getRandomDirection (directions) {
        let index = Math.floor(Math.random()*directions.length);
        let dir = directions[index];
        directions.splice(index, 1);
    }

    generate () {
        let pos = {
            x: 0,
            y: Math.floor(Math.random() * this.h)
        };
        let dir = $DIR.e;

        let range = this.maxLength - this.minLength;
        while (this.graph.edges.length < this.minEdges) {

            /*
            Use a radius of n+1 for checking
            ahead and a radius of n for painting
            so that a minimum gap of
            1 space is left between the paths
             */

            //Free spaces before a collision
            let length = this.minAhead(pos, dir, 3);

            //Path distance
            let dist = this.minLength + Math.floor(Math.random() * range);
            dist = dist > length ? length : dist;



            //New direction
            let directions = [];
            for (let d in $DIR) {

                //Adds perpendicular vectors to directions
                if ($DIR.hasOwnProperty(d)) {
                    if ($VECTOR.dot(d, dir) === 0) {
                        directions.push(d);
                    }
                }

            }

            //Get random direction
            while (length < this.minLength || directions.length <= 0) {
                this.getRandomDirection(directions);
                length = this.minAhead(pos, dir, 3);
            }

            //Go back in graph and try a new point, then redraw
            if (directions.length <= 0) {
                //TODO go back in graph
            }

        }

    }

}

//EXPORTS
exports.canvas = WorldCanvas;
exports.paint = $PAINT;
exports.node = Node;