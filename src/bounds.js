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

        if (normal === true) {
            //TODO
        }

        return this.xMin === point.xMin && this.yMin === point.yMin;
    }

    //TODO For a line

    //For a box
    inBoundsBox (bounds, normal) {
        let x = this.xMin;
        let y = this.yMin;

        if (normal === true) {
            //TODO
        }

        return (x >= bounds.xMin && x <= bounds.xMax) && (y >= bounds.yMin && y <= bounds.yMax);
    }
    
    inBoundsCircle (bounds, normal) {
        let dx = this.xMin - bounds.x;
        let dy = this.yMin - bounds.y;

        if (normal === true) {
            //TODO
        }

        return (dx*dx + dy*dy) <= (bounds.radius*bounds.radius);
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

    constructor () {

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
        if (normal === true) {
            let dx = x - Math.max(this.xMin, Math.min(x, this.xMax)); //Nearest point from point to box
            let dy = y - Math.max(this.yMin, Math.min(y, this.yMax));
            return $VECTOR.nrm({x: dx, y: dy}); //Normalised normal
        }
        return (x >= this.xMin && x <= this.xMax) && (y >= this.yMin && y <= this.yMax);
    }

    //For another Box
    inBoundsBox (bounds, normal) {
        if (normal === true) {
            //TODO
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
        if (normal === true) {return $VECTOR.nrm({x: dx, y: dy});}
        return (dx*dx + dy*dy) <= (circle.radius*circle.radius);
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
        if (normal === true) {return $VECTOR.nrm({x: dx, y: dy});}
        return (dx*dx + dy*dy) <= (this.radius*this.radius);
    }

    inBoundsCircle (circle, normal) {
        let dir = {x: circle.x - this.x, y: circle.y - this.y};
        if (normal === true) {return $VECTOR.nrm(dir);}
        let dist = $VECTOR.mag(dir);
        return dist <= this.radius + circle.radius;
    }

    inBoundsBox (box, normal) {
        //Test from https://yal.cc/rectangle-circle-intersection-test/
        let dx = this.x - Math.max(box.xMin, Math.min(this.x, box.xMax)); //d for distance
        let dy = this.y - Math.max(box.yMin, Math.min(this.y, box.yMax));
        if (normal === true) {
            return $VECTOR.nrm({x: -dx, y: -dy}); //-ve so normal is away from bounds
        }
        return (dx*dx + dy*dy) <= (this.radius*this.radius);
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
    //line: Line
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