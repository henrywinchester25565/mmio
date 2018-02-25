//REQUIREMENTS
const $VECTOR = require('./general.js').vector;
const $BOUNDS = require('./bounds.js');

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
            this.edges.splice(index, 1);
            edge.split();
        }
    }

    back () {
        if (this.nodes.length > 1) {
            this.removeNode(this.current);
        }
        return this.nodes[this.nodes.length-1];
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
    line (start, end, value, radius, under) {
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

            let pos = {x: x, y: y};
            if (this.inCanvas(pos)) {
                if (this.canvas[pos.x][pos.y] !== under) {
                    this.paint(pos, value, radius);
                }
            }
        }

        //Paint y values
        let my = (end.x - start.x) / (end.y - start.y);

        for (let y = minY; y <= maxY; y++) {
            let x = start.x + my*(y - start.y);
            x = Math.round(x);

            let pos = {x: x, y: y};
            if (this.inCanvas(pos)) {
                if (this.canvas[pos.x][pos.y] !== under) {
                    this.paint(pos, value, radius);
                }
            }
        }

    }

    print () {
        let canvas = this.canvas;

        //Top coords
        let top = '    ';
        for (let x = 0; x < this.w; x++) {
            let char = (x + '   ').substring(0, 3);
            top = top.concat(char);
        }
        console.log(top);

        for (let y = 0; y < this.h; y++) {
            let row = (y + '   ').substring(0, 3);
            for (let x = 0; x < this.w; x++) {
                let char = (canvas[x][y] + '   ').substring(0, 3);
                row = row.concat(char);
            }
            console.log(row);
        }
    }

}

//PAINT
//Values representing different entities
const $PAINT = {
    void: '.',
    path: ' ',
    wall: '##',
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
        this.w = w < 24 || 24;
        this.h = h < 24 || 24;
        this.graph = new Graph();
        this.canvas = new WorldCanvas(w, h, $PAINT.void);

        this.minLength = min - min%3 +2|| 2*3+2;
        this.maxLength = max - min%3 +2|| 7*3+2;
        this.minEdges  = edg           || 30;
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
    minAhead (pos, dir, radius, offset) {
        let start = dir.x === 0 ? pos.x : pos.y;

        //Adjust for offset to avoid collisions with self
        pos = $VECTOR.add(pos, $VECTOR.pro(offset, dir));

        let dist = Math.max(this.w, this.h);
        let l = 0;
        for (l; l < dist; l++) {
            pos = $VECTOR.add(pos, dir);

            if (!this.canvas.inCanvas(pos)) {
                return l-radius; //-radius so there are gaps of size radius
            }

            for (let i = start - radius; i <= start + radius; i++) {
                if (dir.x === 0) {
                    if (!this.canvas.inCanvas({x: i, y: pos.y})) {return l-radius;}
                    if (this.canvas.canvas[i][pos.y] !== $PAINT.void) {return l-radius;}
                }
                else if (dir.y === 0) {
                    if (!this.canvas.inCanvas({x: pos.x, y: i})) {return l-radius;}
                    if (this.canvas.canvas[pos.x][i] !== $PAINT.void) {return l-radius;}
                }
            }
        }
        return l;
    }

    getRandomDirection (directions) {
        let index = Math.floor(Math.random()*directions.length);
        let dir = directions[index];
        directions.splice(index, 1);
        return dir;
    }

    newDirection (directions, pos, c, r) {
        //Get random direction
        let length = 0;
        let newDir = undefined;
        while (length < this.minLength && directions.length > 0) {
            newDir = this.getRandomDirection(directions);
            length = this.minAhead(pos, newDir, c, r);
            length = length < this.minLength ? 0 : length;
        }
        return length >= this.minLength ? newDir : undefined;
    }

    getCorner (pos, r) {
        r++; //Outside line
        let corners = [
            $VECTOR.add(pos, {x: -r, y: -r}),
            $VECTOR.add(pos, {x: -r, y:  r}),
            $VECTOR.add(pos, {x:  r, y: -r}),
            $VECTOR.add(pos, {x:  r, y:  r})
        ];

        for (let i = 0; i < corners.length; i++) {
            //Check above, below, left, right for non-void
            let failed = false;
            for (let d in $DIR) {
                if ($DIR.hasOwnProperty(d)) {
                    let spc = $VECTOR.add($DIR[d], corners[i]);
                    if (this.canvas.inCanvas(spc)) {
                        failed = this.canvas.canvas[spc.x][spc.y] === $PAINT.path;
                    }
                }
            }
            if (!failed) {
                //Can only have one corner
                //Make corner inside line
                let offset = $VECTOR.add(pos, $VECTOR.pro(-1, corners[i]));
                offset.x = offset.x / (Math.abs(offset.x)); //One unit
                offset.y = offset.y / (Math.abs(offset.y)); //Sign preserved
                return $VECTOR.add(offset, corners[i]);
            }
        }
    }

    generate () {
        console.log('>> World generating...');

        let pos = {
            x: 4,
            y: Math.floor(Math.random() * (this.h - 12))+6
        };
        let dir = $DIR.e;

        //Add first node to graph
        let start = new Node(pos);
        start.dir = dir;
        this.graph.addNode(start);

        let range = this.maxLength - this.minLength;

        //Main path
        let r = 1;
        let c = r+3;

        let attempts = 0;
        while (this.graph.edges.length < this.minEdges && attempts < this.minEdges*3) {

            /*
            Use a radius of n+1 for checking
            ahead and a radius of n for painting
            so that a minimum gap of
            1 space is left between the paths
             */

            //Free spaces before a collision
            let length = this.minAhead(pos, dir, c, r);

            //Path distance
            let dist = this.minLength + Math.floor(Math.random() * range);
            dist = (dist - dist%3);
            dist = dist > length ? length : dist;

            //Node dist away in direction dir from start
            let end = new Node($VECTOR.add($VECTOR.pro(dist, dir), start.pos));
            //Some details for debugging
            //Add end to graph, where weight is the radius for drawing
            this.graph.line(end, r);
            //Draw onto canvas
            this.canvas.line(start.pos, end.pos, $PAINT.path, r);
            start = end;
            pos = start.pos;

            //New direction
            let directions = [];
            for (let d in $DIR) {

                //Adds perpendicular vectors to directions
                if ($DIR.hasOwnProperty(d)) {
                    if ($VECTOR.dot($DIR[d], dir) === 0) {
                        directions.push($DIR[d]);
                    }
                }

            }

            //Test perpendicular directions
            let newDir = this.newDirection(directions, pos, c, r);

            //If failed, try the old direction
            if (newDir === undefined) {
                //If can't go in dir, newDir === undefined is true
                newDir = this.newDirection([dir], pos, c, r);
            }

            //Set dir to newDir (even if failed, since below will step back a node instead)
            dir = newDir;
            start.dir = dir;

            //If that has also failed, go back in the graph
            if (dir === undefined) {
                let node;
                let attempts = 0;
                while (dir === undefined) {
                    node = this.graph.back();
                    //Get directions away from node
                    directions = [];
                    for (let d in $DIR) {
                        if ($DIR.hasOwnProperty(d) && $DIR[d] !== dir) {
                            directions.push($DIR[d]);
                        }
                    }
                    //Random available direction
                    dir = this.newDirection(directions, node.pos, c, r);
                    //If dir === undefined (none available) go back in graph again
                }
                //When a node with a new direction is found
                //Redraw graph and start process again
                start = node;
                this.drawGraph('###');
            }

            //If attempts too many, terminate
            attempts++;

        }

        //Draw graph and print last time
        console.log('### FINAL ROUTE ###');
        this.drawGraph($PAINT.path);
        this.canvas.print();

        //Walls
        let n=1;
        //Drag boxes over the corner nodes in the directions of the paths
        let nodes = this.graph.nodes.slice();
        //Give nodes boundaries
        for (let i = 0; i < nodes.length; i++) {
            nodes[i].bounds = new $BOUNDS.bounds.point(nodes[i].pos.x, nodes[i].pos.y)
        }
        //Draw walls until all nodes covered in walls
        let rooms = [];
        let containedNodes = []; //TODO make contained edges
        //While not all nodes in a room
        while (containedNodes.length !== this.graph.nodes.length) {
            //Get the corner pos of the node
            let index = Math.floor(nodes.length * Math.random()); //Get random node
            let corner = this.getCorner(nodes[index].pos, 1);
            nodes.splice(index, 1); //Remove node after use

            //Drag wall
            let points = [];
            for (let d in $DIR) {
                if ($DIR.hasOwnProperty(d)) {

                    let next = $VECTOR.add(corner, $DIR[d]);
                    //Follow path
                    while (this.canvas.canvas[next.x][next.y] === $PAINT.path) {
                        next = $VECTOR.add(next, $DIR[d]);
                    }
                    points.push(next);

                }
            }

            //COLLIDE
            //Get boundaries
            let minX = Math.min(points[0].x, points[1].x, points[2].x, points[3].x);
            let maxX = Math.max(points[0].x, points[1].x, points[2].x, points[3].x);
            let minY = Math.min(points[0].y, points[1].y, points[2].y, points[3].y);
            let maxY = Math.max(points[0].y, points[1].y, points[2].y, points[3].y);

            //Make wall bounds
            let room = {id: n};
            room.bounds = new $BOUNDS.bounds.box(minX, minY, maxX-minX, maxY-minY);
            rooms.push(room);

            //Collide nodes and room
            let collisions = $BOUNDS.getCollisions(this.graph.nodes, [room]);
            for (let i = 0; i < collisions.length; i++) {
                let node = collisions[i][0] === room ? collisions[i][1] : collisions[i][0];
                //Add newly contained nodes to containedNodes
                if (containedNodes.indexOf(node) === -1) {
                    containedNodes.push(node);
                }
            }

            //DRAW
            //Vertices
            let a = {x: minX, y: minY};
            let b = {x: maxX, y: minY};
            let c = {x: minX, y: maxY};
            let d = {x: maxX, y: maxY};

            //Draw walls
            this.canvas.line(a, b, $PAINT.wall, 0, $PAINT.path);
            this.canvas.line(b, d, $PAINT.wall, 0, $PAINT.path);
            this.canvas.line(d, c, $PAINT.wall, 0, $PAINT.path);
            this.canvas.line(c, a, $PAINT.wall, 0, $PAINT.path);
        }

        //TODO Push and Pull walls
        //Walls causing corridors get pushed
        //Walls with void in their direction get pulled
        //Fill in empty space where there is no path

        //Print with walls
        console.log('### WITH WALLS ###');
        this.canvas.print();

    }

}

//EXPORTS
module.exports = WorldGen;