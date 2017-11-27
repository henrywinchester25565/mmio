"use strict";
const $VECTOR = require ('./general').$VECTOR;

//Axis Aligned Bounding Box
class AABB {

    constructor (x, y, w, h) {
        this.w = w;
        this.h = h;
        this.type = 'aabb';

        this.update(x, y);
    }

    update (x, y) {
        this.xMin = x;
        this.xMax = x + w;
        this.yMin = y;
        this.yMax = y + h;
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
        if (this.yMin > bounds.yMax) {return false}
        return true;
    }

    inBoundsCirlce (circle) {
        //TODO
    }

    inBounds (bounding) {
        switch (bounding.type) {
            case 'aabb': return this.inBoundsAABB(bounding);
            case 'c': return this.inBoundsCirlce(bounding);
            default:
                if (typeof bounding.x !== 'undefined' && typeof bounding.y !== 'undefined') {
                    return this.inBoundsPoint(bounding.x, bounding.y);
                }
        }
    }

}

//For circles
class BoundingCircle {

    //x, y from top left corner
    constructor (x, y, radius) {
        this.radius = radius;
        this.type = 'c';

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

    inBoundsCirlce (circle) {
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
            case 'c': return this.inBoundsCirlce(bounding);
            default:
                if (typeof bounding.x !== 'undefined' && typeof bounding.y !== 'undefined') {
                    return this.inBoundsPoint(bounding.x, bounding.y);
                }
        }
    }

}

//EXPORTS
exports.$AABB = AABB;