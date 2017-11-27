//DESC: BOUNDING GEOMETRY
"use strict";

//LOADED
console.log("Loaded: bounds.js");

//REQUIREMENTS
const $VECTOR = require ('./general').vector;

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
        this.xMax = x + w;
        this.yMin = y;
        this.yMax = y + h;
    }

    stretch (x, y) {
        let xO = this.xMin + this.w * 0.5;
        let yO = this.yMin + this.h * 0.5;

        this.w = this.w * x;
        this.h = this.h * y;

        this.xMin = xO - this.w * 0.5;
        this.xMax = xO + this.w * 0.5;
        this.yMin = yO - this.h * 0.5;
        this.yMax = xO + this.h * 0.5;
    }

    //For a point
    inBoundsPoint (x, y) {
        return (x >= this.xMin && x < this.xMax) && (y >= this.yMin && y < this.yMax);
    }

    //For another AABB
    inBoundsAABB (bounds) {
        if (this.xMax < bounds.xMin) {return false}
        if (this.xMin > bounds.xMax) {return false}
        if (this.yMax < bounds.yMin) {return false}
        return this.yMin <= bounds.yMax;
    }

    inBoundsCircle (circle) {
        //TODO
    }

    inBounds (bounding) {
        switch (bounding.type) {
            case 'box': return this.inBoundsAABB(bounding);
            //case 'circle': return this.inBoundsCircle(bounding);
            default:
                //If now bounding, treat as a point
                if (typeof bounding.x !== 'undefined' && typeof bounding.y !== 'undefined') {
                    return this.inBoundsPoint(bounding.x, bounding.y);
                }
        }
    }

}

//CIRCLE TODO This needs a rewrite
/*class BoundingCircle {

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

    inBoundsAABB (AABB) {
        //TODO
    }

    inBounds (bounding) {
        switch (bounding.type) {
            case 'aabb': return this.inBoundsAABB(bounding);
            case 'circle': return this.inBoundsCircle(bounding);
            default:
                if (typeof bounding.x !== 'undefined' && typeof bounding.y !== 'undefined') {
                    return this.inBoundsPoint(bounding.x, bounding.y);
                }
        }
    }
}*/

//LINES
//TODO Lines

//ALL BOUNDING
const $BOUNDS = {
    box: Box//,
    //circle: BoundingCircle
};

//CHECK IF BOUNDS
const $IS_BOUNDS = function (bounds) {
    return $BOUNDS[bounds.type] !== undefined;
};

//CAST TESTING
//A general test for possible intersection of bounds by casting
//Elements refers to an array of all bounds being tested
//Casts and checks x coordinates
//Returns md array of all intersections
const $CAST = function (elements, specific) {
    let intersections = []; //Array of arrays of intersecting bounds
    let active = []; //Active bounds
    let cast = []; //Cast start and end points of the bounds

    //Cast all points down
    for (let i = 0; i < elements.length; i++) {
        let bounds;
        //For bounds
        if ($IS_BOUNDS(elements[i])) {
            bounds = elements[i];
        }
        //For entity
        else if (elements[i].bounds !== undefined) {
            bounds = elements[i].bounds;
        }
        //For a single point
        else if (elements[i].x !== undefined && elements[i].y !== undefined) {
            bounds = {xMin: x, xMax: x};
        }
        //If can be cast
        if (bounds.xMin !== undefined && bounds.xMax !== undefined) {
            //TODO Need a way of casting and checking for intersection that fairly simple
        }
        //Else just continue and ignore it
    }

    //If looking for general intersections
    if (specific === undefined) {
    }
};

//EXPORTS
exports.bounds = $BOUNDS;
exports.isBounds = $IS_BOUNDS;
exports.cast = $CAST;