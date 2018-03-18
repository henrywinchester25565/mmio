//DESC: BOUNDING GEOMETRY
"use strict";

//LOADED
console.log("Loaded: bounds.js");

//REQUIREMENTS
const $VECTOR = require ('./general').vector;

//TEST IF IN BOUNDS
const $IN_BOUNDS = function (a, b, normal) {
    switch (b.type) {
        case 'point': return a.inBoundsPoint(b, normal);
        case 'box': return a.inBoundsBox(b, normal);
        case 'circle': return a.inBoundsCircle(b, normal);
        case  'line': return a.inBoundsLine(b, normal);
        default: return false;
    }
};

//POINT
class Point {

    constructor (x, y) {
        this.type = 'point';
        this.update(x, y);
    }

    update (x, y) {
        this.xMin = x;
        this.xMax = x;
        this.yMin = y;
        this.yMax = y;
    }

    //For another point
    inBoundsPoint (point, normal) {
        if (normal) {
            let dir = {x: point.xMin - this.xMin, y: point.yMin - this.yMin};
            return $VECTOR.nrm(dir);
        }

        return this.xMin === point.xMin && this.yMin === point.yMin;
    }

    //For a box
    inBoundsBox (bounds, normal) {
        let x = this.xMin;
        let y = this.yMin;

        if (normal) {
            //Use circle check - it gives vector to closest point to box from point
            let dx = x - Math.max(bounds.xMin, Math.min(x, bounds.xMax));
            let dy = y - Math.max(bounds.yMin, Math.min(y, bounds.yMax));
            return $VECTOR.nrm({x: -dx, y: -dy});
        }

        return (x >= bounds.xMin && x <= bounds.xMax) && (y >= bounds.yMin && y <= bounds.yMax);
    }
    
    //For a circle
    inBoundsCircle (bounds, normal) {
        let dx = bounds.x - this.xMin;
        let dy = bounds.y - this.yMin;

        if (normal) {
            let dir = {x: dx, y: dy};
            return $VECTOR.nrm(dir);
        }

        return (dx*dx + dy*dy) <= (bounds.radius*bounds.radius);
    }
    
    //For a line
    inBoundsLine (line, normal) {
        if (normal) {return undefined};
        //Maths from http://mathworld.wolfram.com/Point-LineDistance2-Dimensional.html
        let nrm = $VECTOR.nrm({x: line.end.y-line.pos.y, y: line.pos.x-line.end.x});
        let r = {x: line.pos.x-this.x, y: line.pos.y-this.y};
        let d = Math.abs($VECTOR.dot(r, nrm));
        return d === 0; //Point is on line
    }

    inBounds (bounds) {
        return $IN_BOUNDS(this, bounds);
    }

    getNormal (bounds) {
        return $IN_BOUNDS(this, bounds, true);
    }

}

//LINES
class Line {

    constructor (x, y, l, dir) {
        this.l = l || 1;
        this.dir = dir || {x: 1, y: 0}; //Should be a normalised direction

        this.pos = {};
        this.end = {}; //Can also be set as something and dir/length can be left alone
        this.update(x, y);
    }

    //Effectively translate both points
    update (x, y) {
        this.pos.x = x || this.pos.x;
        this.pos.y = y || this.pos.y;

        this.end = $VECTOR.add({x: this.x, y: this.y }, $VECTOR.pro(this.l, this.dir));
        this.xMin = Math.min(this.pos.x, this.end.x);
        this.xMax = Math.max(this.pos.x, this.end.x);
    }

    //Length updates end
    set length (l) {
        this.l = l;
        this.update();
    }

    get length () {
        return this.l;
    }

    //Direction updates end
    set direction (dir) {
        this.dir = dir;
        this.update();
    }

    get direction () {
        return this.dir;
    }

    //Used to abstract position
    set x (x) {
        this.update(x, this.y);
    }

    get x () {
        return this.pos.x;
    }

    set y (y) {
        this.update(this.x, y);
    }

    get y () {
        return this.pos.y;
    }

    //Collision tests
    //Don't produce normals, so can't be used in physics
    //Solution might be to tip a line with a circle

    //For a point
    inBoundsPoint (point, normal) {
        if (normal) {return undefined};
        //Maths from http://mathworld.wolfram.com/Point-LineDistance2-Dimensional.html
        let nrm = $VECTOR.nrm({x: this.end.y-this.pos.y, y: this.pos.x-this.end.x});
        let r = {x: this.pos.x-point.x, y: this.pos.y-point.y};
        let d = Math.abs($VECTOR.dot(r, nrm));
        return d === 0; //Point is on line
    }
    
    //For a circle
    inBoundsCircle (circle, normal) {
        if (normal) {return undefined};
        //Maths from http://mathworld.wolfram.com/Point-LineDistance2-Dimensional.html
        let nrm = $VECTOR.nrm({x: this.end.y-this.pos.y, y: this.pos.x-this.end.x});
        let r = {x: this.pos.x-circle.x, y: this.pos.y-circle.y};
        let d = Math.abs($VECTOR.dot(r, nrm));
        return d <= circle.radius; //Point is on line
    }

    //For a box
    inBoundsBox (bounds, normal) {
        if (normal) {return undefined};
        //Test if inside box
        //Convert line points to point bounds and test both inside box
        let p1 = new Point(this.pos.x, this.pos.y);
        let p2 = new Point(this.end.x, this.end.y);
        if (p1.inBoundsBox(bounds) && p2.inBounds(bounds)) {
            return true; //Line in box
        }
        
        //Convert box to four line bounds and use line bound test
        let l1 = new Line(bounds.xMin, bounds.yMin);
        l1.end = {x: bounds.xMin, y: bounds.yMax};
        if (l1.inBoundsLine(this)) {
            return true;
        }

        let l2 = new Line(bounds.xMin, bounds.yMax);
        l2.end = {x: bounds.xMin, y: bounds.yMax};
        if (l2.inBoundsLine(this)) {
            return true;
        }

        let l3 = new Line(bounds.xMin, bounds.yMin);
        l3.end = {x: bounds.xMin, y: bounds.yMax};
        if (l3.inBoundsLine(this)) {
            return true;
        }

        let l4 = new Line(bounds.xMin, bounds.yMin);
        l4.end = {x: bounds.xMin, y: bounds.yMax};
        if (l4.inBoundsLine(this)) {
            return true;
        }
        
        //Not in bounds
        return false;
    }

    //For a line
    inBoundsLine (line, normal) {
        if (normal) {return undefined};
        //Adapted from https://stackoverflow.com/questions/3746274/line-intersection-with-aabb-rectangle
        let d1 = $VECTOR.add(this.end, $VECTOR.pro(-1, this.pos));
        let d2 = $VECTOR.add(line.end, $VECTOR.pro(-1, line.pos));
        
        //d1 dot perpendicular of d2, if === 0 then parallel
        let p = d1.x * d2.y - d1.y * d2.x;
        
        if (p === 0) {
            return false; //No intersection, not in bounds
        }
        
        let d3 = $VECTOR.add(line.pos, $VECTOR.pro(-1, this.pos));
        
        let t = (d3.x * d2.y - d3.y * d2.x)/p;
        if (t < 0 || t > 1) {
            return false;
        }
        
        let u = (d3.x * d1.y - d3.y * d1.x)/p;
        if (u < 0 || u > 1) {
            return false;
        }
        
        //INTERSECTION
        // let intersection = $VECTOR.add(this.pos, $VECTOR.pro(t, d1));
        
        return true;
    }

    //Wrapper function
    inBounds (bounds) {
        return $IN_BOUNDS(this, bounds);
    }

}

//AXIS ALIGNED BOUNDING BOX
class Box {

    constructor (x, y, w, h) {
        this.w = w;
        this.h = h;
        this.type = 'box';

        this.update(x, y);
    }

    update (x, y) {
        this.xMin = x;
        this.xMax = x + this.w;
        this.yMin = y;
        this.yMax = y + this.h;
    }

    //For a point
    inBoundsPoint (point, normal) {
        let x = point.xMin;
        let y = point.yMin;
        if (normal) {
            let dx = x - Math.max(this.xMin, Math.min(x, this.xMax)); //Nearest point from point to box
            let dy = y - Math.max(this.yMin, Math.min(y, this.yMax));
            return $VECTOR.nrm({x: dx, y: dy}); //Normalised normal
        }
        return (x >= this.xMin && x <= this.xMax) && (y >= this.yMin && y <= this.yMax);
    }

    //For another Box
    inBoundsBox (bounds, normal) {
        if (normal) {
            return undefined;
        }
        if (this.xMax < bounds.xMin) {return false}
        if (this.xMin >= bounds.xMax) {return false}
        if (this.yMax < bounds.yMin) {return false}
        return this.yMin <= bounds.yMax;
    }

    inBoundsCircle (circle, normal) {
        //Test from https://yal.cc/rectangle-circle-intersection-test/
        let dx = circle.x - Math.max(this.xMin, Math.min(circle.x, this.xMax));
        let dy = circle.y - Math.max(this.yMin, Math.min(circle.y, this.yMax));
        if (normal) {return $VECTOR.nrm({x: dx, y: dy});}
        return (dx*dx + dy*dy) <= (circle.radius*circle.radius);
    }
    
    inBoundsLine (line, normal) {
        if (normal) {return undefined};
        //Test if inside box
        //Convert line points to point this and test both inside box
        let p1 = new Point(line.pos.x, line.pos.y);
        let p2 = new Point(line.end.x, line.end.y);
        if (p1.inBoundsBox(this) && p2.inBounds(this)) {
            return true; //Line in box
        }

        //Convert box to four line this and use line bound test
        let l1 = new Line(this.xMin, this.yMin);
        l1.end = {x: this.xMin, y: this.yMax};
        if (l1.inBoundsLine(line)) {
            return true;
        }

        let l2 = new Line(this.xMin, this.yMax);
        l2.end = {x: this.xMin, y: this.yMax};
        if (l2.inBoundsLine(line)) {
            return true;
        }

        let l3 = new Line(this.xMin, this.yMin);
        l3.end = {x: this.xMin, y: this.yMax};
        if (l3.inBoundsLine(line)) {
            return true;
        }

        let l4 = new Line(this.xMin, this.yMin);
        l4.end = {x: this.xMin, y: this.yMax};
        if (l4.inBoundsLine(line)) {
            return true;
        }

        //Not in bounds
        return false;
    }

    //Wrapper function
    inBounds (bounds) {
        return $IN_BOUNDS(this, bounds);
    }

    getNormal (bounds) {
        return $IN_BOUNDS(this, bounds, true);
    }

}

//CIRCLE
class Circle {

    //x, y from top left corner
    constructor (x, y, radius) {
        this.radius = radius;
        this.type = 'circle';

        this.update(x, y);
    }

    set r (r) { //For changing size of bounds easily
        this.radius = r;
        this.update(this.x, this.y);
    }

    update (x, y) {
        this.x = x;
        this.y = y;
        let r = this.radius;
        this.xMax = this.x + r;//Required for broad phase collision detection
        this.xMin = this.x - r;
    }

    inBoundsPoint (point, normal) {
        let dx = point.xMin - this.x;
        let dy = point.yMin - this.y;
        if (normal) {return $VECTOR.nrm({x: dx, y: dy});}
        return (dx*dx + dy*dy) <= (this.radius*this.radius);
    }

    inBoundsCircle (circle, normal) {
        let dir = {x: circle.x - this.x, y: circle.y - this.y};
        if (normal) {return $VECTOR.nrm(dir);}
        let dist = $VECTOR.mag(dir);
        return dist <= this.radius + circle.radius;
    }

    inBoundsBox (box, normal) {
        //Test from https://yal.cc/rectangle-circle-intersection-test/
        let dx = this.x - Math.max(box.xMin, Math.min(this.x, box.xMax)); //d for distance
        let dy = this.y - Math.max(box.yMin, Math.min(this.y, box.yMax));
        if (normal) {
            return $VECTOR.nrm({x: -dx, y: -dy}); //-ve so normal is away from bounds
        }
        return (dx*dx + dy*dy) <= (this.radius*this.radius);
    }

    inBoundsLine (line, normal) {
        if (normal) {return undefined};
        //Maths from http://mathworld.wolfram.com/Point-LineDistance2-Dimensional.html
        let nrm = $VECTOR.nrm({x: line.end.y-line.pos.y, y: line.pos.x-line.end.x});
        let r = {x: line.pos.x-this.x, y: line.pos.y-this.y};
        let d = Math.abs($VECTOR.dot(r, nrm));
        return d <= line.radius; //Point is on line

    }

    inBounds (bounds) {
        return $IN_BOUNDS(this, bounds);
    }

    getNormal (bounds) {
        return $IN_BOUNDS(this, bounds, true);
    }


}

//ALL BOUNDING
const $BOUNDS = {
    box: Box,
    point: Point,
    line: Line,
    circle: Circle
};

//CHECK IF BOUNDS
const $IS_BOUNDS = function (bounds) {
    return $BOUNDS[bounds.type] !== undefined;
};

//TESTS FOR COLLISIONS
//The entities aren't bounds themselves, but contain a bounds property
//Does both broad and narrow phases
const $COLLISIONS = function (entities, specific) {

    //BROAD PHASE
    //Map entities to x axis with start and stop points
    let map = [];
    //Iterates over entities and orders in map
    for (let i = 0; i < entities.length; i++) {
        //Start and end points
        let start = {entity: entities[i], x: entities[i].bounds.xMin, start: true};
        let end = {entity: entities[i], x: entities[i].bounds.xMax, start: false};

        //Iterate over - O(nlogn)
        let points = [start, end];
        for (let j = 0; j < 2; j++) {
            //Since map will be sorted, use binary search
            let floor = -1;
            let ceil = map.length;
            let inserted = false;
            while (!inserted) {
                let index = Math.floor((ceil + floor) / 2);
                //Found insertion index
                if (ceil - floor === 1) {
                    map.splice(ceil, 0, points[j]);
                    inserted = true;
                }
                else if (map[index].x === points[j].x) {
                    map.splice(index, 0, points[j]);
                    inserted = true;
                }
                //Move search area
                else if (map[index].x > points[j].x) {
                    ceil = index;
                }
                else if (map[index].x < points[j].x) {
                    floor = index;
                }
            }
        }

    }

    let collisions = [];
    if (specific === undefined) {

        //For nonspecific cases
        //Initial collisions from map
        let active = [];
        for (let i = 0; i < map.length; i++) {
            let current = map[i].entity;
            if (map[i].start) { //If its the start of the bounds
                for (let j = 0; j < active.length; j++) { //For all the currently active bounds
                    //NARROW PHASE
                    if (current.bounds.inBounds(active[j].bounds)) { //Perform a bounds check
                        collisions.push([current, active[j]]); //And add to collisions
                    }
                }
                active.push(current);
            }
            //Remove when ends
            else {
                let index = active.indexOf(current);
                if (index > -1) {
                    active.splice(index, 1);
                }
            }
        }

    }
    //If one set collides with another
    else {

        for (let i = 0; i < specific.length; i++) {
            let entity = specific[i];
            //linear search for bounds
            for (let j = 0; j < map.length; j++) {
                if(map[j].start) {
                    //NARROW PHASE
                    if(entity.bounds.inBounds(map[j].entity.bounds)) {
                        collisions.push([map[j].entity, entity]);
                    }
                }
            }
        }

    }

    return collisions;

};

//EXPORTS
exports.bounds = $BOUNDS;
exports.isBounds = $IS_BOUNDS;
exports.getCollisions = $COLLISIONS;