//REQUIREMENTS
const $VECTOR = require('./general.js').vector;
const $BOUNDS = require('./bounds.js');
const $WORLD  = require('./world.js');
const $ENTITY = require('./entity.js');

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
    gate: 'G',
    barrel: 'O',
    wolf: 'W'
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
        this.w = w < 24 ? 24 : w;
        this.h = h < 24 ? 24 : h;
        this.graph = new Graph();

        this.minLength = min - min%3 +2|| 2*3+2;
        this.maxLength = max - max%3 +2|| 7*3+2;
        this.minEdges  = edg           || 30;

        this.enemies = [];
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

    //Tests to see if wall is end of wall (maximum of one wall besides it)
    //And returns the directions of the neighbouring wall, (0,0 if has none) or undefined
    endDir (pos, canvas) {
        canvas = canvas || this.canvas;
        let dir;
        for (let d in $DIR) {
            if ($DIR.hasOwnProperty(d)) {

                let spc = $VECTOR.add($DIR[d], pos);
                if (canvas.inCanvas(spc)) {
                    if (canvas.canvas[spc.x][spc.y] === $PAINT.wall) {

                        //Set dir to directions if wall
                        if (dir === undefined) {
                            dir = $DIR[d];
                        }
                        else {
                            return; //Return undefined
                        }

                    }
                 }

            }
        }
        dir = dir || {x: 0, y: 0};
        return dir;
    }

    //Tests to see if wall is an edge/corner
    isEdge (pos, dir) {
        //Get sides of
        let sides = [];
        for (let d in $DIR) {
            if ($DIR.hasOwnProperty(d)) {
                if ($VECTOR.dot($DIR[d], dir) === 0) {
                    sides.push($DIR[d]);
                }
            }
        }

        //Check sides for edge/corner
        for (let i = 0; i < sides.length; i++) {
            let side = $VECTOR.add(pos, sides[i]);
            //If corner or edge
            if (this.canvas.inCanvas(side)) {
                if (this.canvas.canvas[side.x][side.y] === $PAINT.wall) {
                    return true;
                }
            }
        }

        return false;
    }

    pushLine (pos, dir, canvas) {
        canvas = canvas || this.canvas;
        while (true) {
            //Test ahead
            let next = $VECTOR.add(dir, pos);
            if (canvas.inCanvas(next)) {
                //If reaches end of wall
                if (canvas.canvas[next.x][next.y] !== $PAINT.wall) {
                    return pos;
                }
            }
            //Reaches end of map
            else {
                return pos;
            }

            //Test for corner/edge
            let sides = this.isEdge(pos, dir);
            if (sides) {
                return pos;
            }

            //At this point, next is standalone wall, not at corner or edge
            //Or out of map
            canvas.canvas[pos.x][pos.y] = $PAINT.void; //Delete wall
            pos = next;
        }
    }

    //Tests if there is a corridor from pos in direction d, with width r
    isCorridor (pos, dir, r) {
        //Tests pos is actually a wall
        if (this.canvas.inCanvas(pos)) {
            if (this.canvas.canvas[pos.x][pos.y] !== $PAINT.wall) {
                return false;
            }
        }
        else {
            return false;
        }

        //Test next r spaces are path
        let next = pos;
        for (let i = 0; i < (r*2)+1; i++) {
            next = $VECTOR.add(next, dir);
            //If not in canvas
            if (this.canvas.inCanvas(next)) {
                //If not path
                if (this.canvas.canvas[next.x][next.y] !== $PAINT.path) {
                    return false;
                }
            }
            else {
                return false;
            }
        }

        //One wall then three path, now one wall
        next = $VECTOR.add(next, dir);
        if (this.canvas.inCanvas(next)) {
            //Last space is wall
            if (this.canvas.canvas[next.x][next.y] === $PAINT.wall) {
                return true;
            }
        }
        else {
            return false;
        }
        //Last space isn't wall, but is in canvas
        return false;
    }

    generate () {
        console.log('>> World generating...');

        this.canvas = new WorldCanvas(this.w, this.h, $PAINT.void);

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
            length = (length - length%3);

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
        this.drawGraph($PAINT.path);

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

        //Get directions to operate in
        let directions = [];
        for (let d in $DIR) {
            if ($DIR.hasOwnProperty(d)) {
                directions.push($DIR[d]);
            }
        }

        //Length at which to patch
        let threshold = 4;

        //PUSH
        //Go across canvas in each direction and push where corridors
        for (let i = 0; i < directions.length; i++) {
            dir = directions[i];
            pos = {};
            pos.x = dir.x !== 0 ? (this.w + dir.x) % (this.w + 1) : 0; //Starts at either end based on direction
            pos.y = dir.y !== 0 ? (this.h + dir.y) % (this.h + 1) : 0;
            
            let sideDir = dir.y === 0 ? {x: 0, y: 1} : {x: 1, y: 0}; //If direction is to right, move down
            while (this.canvas.inCanvas(pos)) {
                //Update next represents going down the canvas
                //Pos is going along
                let next = pos;
                while (this.canvas.inCanvas(next)) {
                    if (this.canvas.canvas[next.x][next.y] === $PAINT.wall) {
                        let wallDir = this.endDir(next);
                        //If wall is end of wall
                        if (wallDir !== undefined) {
                            //TODO push lines less than five units long
                            if ($VECTOR.dot(wallDir, dir) === 0 && this.isCorridor(next, dir, r)) {

                                //Push wall down
                                this.pushLine(next, wallDir);

                            }
                        }
                    }
                    next = $VECTOR.add(next, dir);
                }
                pos = $VECTOR.add(pos, sideDir);
            }
        }

        //PATCH
        for (let i = 0; i < directions.length; i++) {
            dir = directions[i];
            pos = {};
            pos.x = dir.x !== 0 ? (this.w + dir.x) % (this.w + 1) : 0; //Starts at either end based on direction
            pos.y = dir.y !== 0 ? (this.h + dir.y) % (this.h + 1) : 0;

            let sideDir = dir.y === 0 ? {x: 0, y: 1} : {x: 1, y: 0}; //If direction is to right, move down
            while (this.canvas.inCanvas(pos)) {
                let next = pos;
                let lastWall;
                let length = 0;
                while (this.canvas.inCanvas(next)) {

                    //Add to length of gap if void between walls
                    if (this.canvas.canvas[next.x][next.y] === $PAINT.void) {
                        if (lastWall !== undefined) {
                            length++;
                        }
                    }
                    else {
                        //If at wall
                        if (this.canvas.canvas[next.x][next.y] === $PAINT.wall) {

                            if (length > 0 && length <= threshold && lastWall !== undefined) {
                                this.canvas.line(lastWall, next, $PAINT.wall, 0)
                            }
                            lastWall = next;
                        }
                        else { //Not at wall, not at void, must be path
                            lastWall = undefined;
                        }

                        //Restart length if no longer gap
                        length = 0;
                    }
                    next = $VECTOR.add(next, dir);
                }
                pos = $VECTOR.add(pos, sideDir);
            }
        }

        //FILL
        //Fill empty space with wall in all four cardinal directions
        for (let i = 0; i < directions.length; i++) {
            dir = directions[i];
            pos = {};
            pos.x = dir.x !== 0 ? (this.w + dir.x) % (this.w + 1) : 0; //Starts at either end based on direction
            pos.y = dir.y !== 0 ? (this.h + dir.y) % (this.h + 1) : 0;

            let sideDir = dir.y === 0 ? {x: 0, y: 1} : {x: 1, y: 0}; //If direction is to right, move down

            while (this.canvas.inCanvas(pos)) {
                let paint = true;
                let next = pos;
                while (this.canvas.inCanvas(next) && paint) {
                    if (this.canvas.canvas[next.x][next.y] === $PAINT.void) {
                        //If pos is void, paint wall and add dir to pos
                        this.canvas.canvas[next.x][next.y] = $PAINT.wall;
                        next = $VECTOR.add(next, dir);

                    }
                    else {
                        paint = false; //Stop painting the moment reaches something non-void
                    }
                }
                pos = $VECTOR.add(pos, sideDir);
            }
        }

        //EXTRACT
        let extracted = new WorldCanvas(this.w, this.h, $PAINT.void);
        let node  = this.graph.nodes[0]; //First node in graph
        for (let i = 0; i < this.graph.nodes.length; i++) {

            //Linearly traverse graph
            let n = node.edges.length > 1 ? node.edges.length-1 : 0;
            let next = node.edges[n].traverse(node);

            //Draw line
            extracted.line(node.pos, next.pos, $PAINT.path, r);

            //Edge direction
            let edgeDir = $VECTOR.nrm($VECTOR.add($VECTOR.pro(-1, node.pos), next.pos));

            //Draw in directions perpendicular to edge direction along edge
            for (let i = 0; i < directions.length; i++) {
                if ($VECTOR.dot(edgeDir, directions[i]) === 0) {

                    dir = directions[i];
                    let start = $VECTOR.add(node.pos, $VECTOR.pro(-1, edgeDir));
                    let end = $VECTOR.add(next.pos, $VECTOR.pro(-1, edgeDir));
                    let pos = start;
                    for (let p = $VECTOR.dot(edgeDir, start); p <= $VECTOR.dot(edgeDir, end); p++) {
                        let ahead = pos;
                        while (this.canvas.inCanvas(ahead) && this.canvas.canvas[ahead.x][ahead.y] !== $PAINT.wall) {
                            extracted.canvas[ahead.x][ahead.y] = $PAINT.path;
                            ahead = $VECTOR.add(ahead, dir);
                        }
                        pos = $VECTOR.add(pos, edgeDir);
                    }

                }
            }

            node = next;

        }

        //CREATE WALLS
        //Expand path area as walls by:
        //> Firing wall in every direction and having it stick when hitting a path
        //Fire a position vector at wall, and carve up in direction of wall
        for (let i = 0; i < directions.length; i++) {
            dir = directions[i];
            pos = {};
            pos.x = dir.x !== 0 ? (this.w + dir.x) % (this.w + 1) : 0; //Starts at either end based on direction
            pos.y = dir.y !== 0 ? (this.h + dir.y) % (this.h + 1) : 0;

            let sideDir = dir.y === 0 ? {x: 0, y: 1} : {x: 1, y: 0}; //If direction is to right, move down

            while (extracted.inCanvas(pos)) {

                let next = pos;
                while (extracted.inCanvas(next)) {
                    
                    if (extracted.canvas[next.x][next.y] === $PAINT.void) {
                        let ahead = $VECTOR.add(next, dir);
                        if (extracted.inCanvas(ahead) && extracted.canvas[ahead.x][ahead.y] === $PAINT.path) {
                            extracted.canvas[next.x][next.y] = $PAINT.wall;
                        }
                    }
                    
                    next = $VECTOR.add(next, dir);
                    
                }

                pos = $VECTOR.add(pos, sideDir);
            }
        }

        //Generated world
        let world = new $WORLD(this.w, this.h);

        this.canvas = extracted;
        //Go through every point of the canvas and carve walls
        let num = 1;
        let wall = true;
        attempts = 50;
        while (wall && attempts > 0) {
            wall = false;
            for (let x = 0; x < this.canvas.canvas.length; x++) {
                for (let y = 0; y < this.canvas.canvas[0].length; y++) {

                    let pos = {x: x, y: y};
                    if (this.canvas.inCanvas(pos) && this.canvas.canvas[x][y] === $PAINT.wall) {
                        wall = true;
                        dir = this.endDir(pos);
                        if (dir !== undefined) {
                            let end = this.pushLine(pos, dir);
                            this.canvas.canvas[pos.x][pos.y] = num;
                            this.canvas.line(pos, end, num, 0, $PAINT.path);
                            num++;

                            //Make walls
                            let xMin = pos.x < end.x ? pos.x : end.x;
                            let yMin = pos.y < end.y ? pos.y : end.y;
                            let w = Math.abs(pos.x - end.x) + 1;
                            let h = Math.abs(pos.y - end.y) + 1;
                            let wall = new $ENTITY.wall(xMin, yMin, w, h);
                            world.queueChild(wall);
                        }
                    }

                }
            }
            attempts --;
        }

        //SPAWN AND EXIT
        //Spawn
        pos       = this.graph.nodes[0].pos;
        let spawn = new $ENTITY.gateway(pos.x, pos.y, false);
        this.canvas.paint(pos, $PAINT.gate, 1);
        world.queueChild(spawn);
        this.spawn = spawn;

        //Exit
        pos       = this.graph.nodes[this.graph.nodes.length-1].pos;
        let exit  = new $ENTITY.gateway(pos.x, pos.y, true);
        this.canvas.paint(pos, $PAINT.gate, 1);
        world.queueChild(exit);
        this.exit = exit;



        //ENTITIES
        //Add barrels
        let barrels = Math.random() * this.graph.edges.length;
        for (let i = 0; i < barrels; i++) {
            pos = {x: 0, y: 0};
            let walls = false;
            while (this.canvas.canvas[pos.x][pos.y] !== $PAINT.path || walls) {
                pos.x = Math.floor(Math.random() * (this.w-1));
                pos.y = Math.floor(Math.random() * (this.h-1));
                //No adjacent walls
                walls = false;
                for (let direction in $DIR) {
                    if ($DIR.hasOwnProperty(direction)) {
                        let check = $VECTOR.add($DIR[direction], pos);
                        if (this.canvas.inCanvas(check) && this.canvas.canvas[check.x][check.y] !== $PAINT.path) {
                            walls = true;
                        }
                    }
                }
            }
            this.canvas.canvas[pos.x][pos.y] = $PAINT.barrel;
            let barrel = new $ENTITY.barrel(pos.x, pos.y);
            world.queueChild(barrel);
        }

        //Add enemies
        let enemies =  4 + Math.random() * this.graph.edges.length * 0.25;
        for (let i = 0; i < enemies; i++) {
            pos = {x: 0, y: 0};
            let walls = false;
            while (this.canvas.canvas[pos.x][pos.y] !== $PAINT.path || walls) {
                pos.x = Math.floor(Math.random() * (this.w-1));
                pos.y = Math.floor(Math.random() * (this.h-1));

                //No adjacent walls
                walls = false;
                for (let direction in $DIR) {
                    if ($DIR.hasOwnProperty(direction)) {
                        let check = $VECTOR.add($DIR[direction], pos);
                        if (this.canvas.inCanvas(check) && this.canvas.canvas[check.x][check.y] !== $PAINT.path) {
                            walls = true;
                        }
                    }
                }
            }
            this.canvas.canvas[pos.x][pos.y] = $PAINT.wolf;
            let wolf = new $ENTITY.enemies.wolf(pos.x, pos.y);
            this.enemies.push(wolf);
            world.queueChild(wolf);
        }

        return world;
    }

}

//EXPORTS
module.exports = WorldGen;