//DESC: BOUNDING GEOMETRY
"use strict";

//LOADED
console.log("Loaded: bounds.js");

//REQUIREMENTS
const $VECTOR = require ('./general').vector;

//TEST IF IN BOUNDS
const $IN_BOUNDS = function (a, b) {
    switch (b.type) {
        case 'point': return a.inBoundsPoint(b);
        case 'box': return a.inBoundsBox(b);
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
    inBoundsPoint (point) {
        return this.xMin === point.xMin && this.yMin === point.yMin;
    }

    //For a line

    //For a box
    inBoundsBox (bounds) {
        let x = this.xMin;
        let y = this.yMin;
        return (x >= bounds.xMin && x <= bounds.xMax) && (y >= bounds.yMin && y <= bounds.yMax);
    }

    //TODO For a circle
    inBoundsCircle () {}

    inBounds (bounds) {
        return $IN_BOUNDS(this, bounds);
    }

    //Get the minimum data for client transfer
    scrape () {
        return {
            xMin: this.x,
            yMin: this.y,
            xMax: this.x,
            yMax: this.y,
            type: this.type
        };
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
    inBoundsPoint (point) {
        let x = point.xMin;
        let y = point.yMin;
        return (x >= this.xMin && x <= this.xMax) && (y >= this.yMin && y <= this.yMax);
    }

    //For another Box
    inBoundsBox (bounds) {
        if (this.xMax < bounds.xMin) {return false}
        if (this.xMin >= bounds.xMax) {return false}
        if (this.yMax < bounds.yMin) {return false}
        return this.yMin <= bounds.yMax;
    }

    inBoundsCircle (bounds) {
        //TODO
    }

    //Wrapper function
    inBounds (bounds) {
        return $IN_BOUNDS(this, bounds);
    }

}

//CIRCLE TODO This needs a rewrite
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
    }

    inBoundsPoint (x, y) {
        let xC = this.x + this.radius;
        let yC = this.y + this.radius;
        let dist = $VECTOR.mag({x: x - xC, y: y - yC});
        return dist <= this.radius;
    }

    inBoundsCircle (circle) {
        let xC = this.x + this.radius;
        let yC = this.y + this.radius;
        let xD = circle.x + circle.radius;
        let yD = circle.y + circle.radius;

        let dist = $VECTOR.mag({x: xD - xC, y: yD - yC});
        return dist <= this.radius + circle.radius;
    }

    inBoundsBox (Box) {
        //TODO
    }

    inBounds (bounding) {
        switch (bounding.type) {
            case 'Box': return this.inBoundsBox(bounding);
            case 'circle': return this.inBoundsCircle(bounding);
            default:
                if (typeof bounding.x !== 'undefined' && typeof bounding.y !== 'undefined') {
                    return this.inBoundsPoint(bounding.x, bounding.y);
                }
        }
    }
}

//ALL BOUNDING
const $BOUNDS = {
    box: Box,
    point: Point,
    //line: Line
    //circle: BoundingCircle
};

//CHECK IF BOUNDS
const $IS_BOUNDS = function (bounds) {
    return $BOUNDS[bounds.type] !== undefined;
};

//TESTS FOR COLLISIONS
//The entities aren't bounds themselves, but contain a bounds property
//Does both broad and narrow phases
//Entities should contain entity for specific collision checks
const $COLLISIONS = function (entities, specific) {

    //BROAD PHASE
    //Map entities to x axis with start and stop points
    let map = [];
    //Iterates over entities and orders in map
    for (let i = 0; i < entities.length; i++) {

        //Start and end points
        let start = {entity: entities[i], x: entities[i].bounds.xMin, start: true};
        let end   = {entity: entities[i], x: entities[i].bounds.xMax, start: false};

        //Iterate over - O(nlogn)
        let points = [start, end];
        for (let j = 0; j < 2; j++) {
            //Since map will be sorted, use binary search
            let floor = -1;
            let ceil = map.length;
            let inserted = false;
            while (!inserted) {
                let index = Math.floor((ceil + floor)/2);
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
            if (map[i].start) {
                //Add collision pairs
                if (current === entity || entity === undefined) {
                    for (let j = 0; j < active.length; j++) {
                        //Exclude chunk chunk collisions
                        //TODO Temp fix, find better solution
                        if (!(current.type === 'chunk' && active[j].type === 'chunk')) {
                            //NARROW PHASE
                            if (current.bounds.inBounds(active[j].bounds)) {
                                collisions.push([current, active[j]]);
                            }
                        }

                    }
                    active.push(current);
                }
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