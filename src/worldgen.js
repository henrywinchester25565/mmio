//DESC: GENERATES RANDOM WORLDS
"use strict";

//LOADED
console.log("Loaded: worldgen.js");

//REQUIREMENT
const $WORLD = require('./world.js');
const $ENTITY = require('./entity.js');
const $VECTOR = require('./general.js').vector;

//WORLD GEN ALGORITHM
/*

Build map with h*w matrix
Plot path through array, dropping nodes when direction changes
Edges should be greater than or equal to three units in length, and odd lengths

Build rooms around paths by drawing rectangles around nodes in direction of path
Stop rooms on contact with other rooms, or end of path

Build node graph for AI

Convert matrix to world and entities

 */

//DEFAULT PARAMETERS
const $PARAMS = {

    width: 147,
    height: 147,
    bend: 0.1,
    length_max: 13,
    length_min: 3,
    branch: 0,
    total: 120

};

//CHARACTERS FOR MATRIX REPRESENTATION
const $CHARS = {
    path: 'o',
    void: '.',
    node: 'X'
};

//DIRECTIONS
const $DIRECTIONS = [
    {x: -1, y:  0}, //0 west
    {x:  0, y:  1}, //1 north
    {x:  1, y:  0}, //2 east
    {x:  0, y: -1}  //3 south
];

//WORLD GEN CLASS
class WorldGen {

    constructor (w, h, bend, min, max, branch) {
        //this.params = $PARAMS;

        this.w = w               || $PARAMS.width;
        this.h = h               || $PARAMS.height;
        this.bend = bend         || $PARAMS.bend;
        this.min = min           || $PARAMS.length_min;
        this.max = max           || $PARAMS.length_max;
        this.branch = branch     || $PARAMS.branch;

        this.createMatrix(this.w, this.h);
        this.plotPath();

    }

    createMatrix () {
        let w = this.w;
        let h = this.h;
        let matrix = [];
        for (let x = 0; x < w; x++) {
            matrix[x] = [];
            for (let y = 0; y < h; y++) {
                matrix[x][y] = $CHARS.void;
            }
        }
        this.matrix = matrix;
    }

    plotPath () {
        //Node
        let Node = function (point) {
            this.x = point.x;
            this.y = point.y;
            this.children = [];
        };

        //For traversal
        let tree = [];

        let matrix = this.matrix;
        
        //Matrix properties
        let w = matrix.length;
        let h = matrix[0].length;

        //Start on west to east
        let dir = $DIRECTIONS[2];

        //Start point, random y
        let point = {x: 0, y: Math.floor(h * Math.random())};
        tree.push(new Node(point));
        matrix[point.x][point.y] = $CHARS.node;

        //Current path length;
        let length = 1;
        let total = 1;

        //When finished plotting
        let end = false;
        while (!end) {

            let next = $VECTOR.add(point, dir);

            //Hits boundary
            if ((next.x <= -1 || next.x >= w-1 || next.y <= -1 || next.y >= h-1) && total > $PARAMS.total) {
                console.log('escape');
                end = true;
            }
            //Otherwise plot path
            else {

                point = next;
                matrix[point.x][point.y] = $CHARS.path;
                length++;
                total++;
                console.log(length);

                //Change dir
                //If meets bend req or max length, and length is odd
                let bend = (Math.random() <= this.bend || length >= this.max) && length % 2 === 1 && length >= this.min;
                //Or if path not clear
                if (!this.clearAhead(matrix, point, dir) || !this.clearAhead(matrix, $VECTOR.add(point, dir), dir)) {
                    console.log('do it anakin');
                    bend = true;
                }

                if (bend) {

                    //For debugging
                    console.log('> BEND');
                    this.print(matrix);

                    let available = this.availableDirections(matrix, point);

                    //If no available $DIRECTIONS
                    if (available.length <= 0) {
                        //Go back through tree to available new path
                        while (available.length <= 0) {

                            //Node in point, doesn't really matter
                            tree.pop();
                            if (tree.length > 0) {
                                point = tree[tree.length - 1];
                                available = this.availableDirections(matrix, point);
                            }
                            else {
                                console.log('no more');
                                end = true;
                            }

                        }
                    }
                    //Set new direction
                    //-0.0001 so that can't be out of bounds
                    let newDir = available[Math.floor(Math.random()*(available.length - 0.0001))];
                    if (dir !== newDir) {
                        length = 1; //Include start of new bend
                        dir = newDir;

                        //Add point of direction change to tree
                        let node = new Node (point);
                        matrix[point.x][point.y] = $CHARS.node;
                        tree[tree.length-1].children.push(node);
                        tree.push(node);
                    }

                }

            }

        }

        //For debugging
        console.log('> FINISHED');
        this.print(matrix);
        console.log(tree);
        this.matrix = matrix;
    }

    clearAhead (matrix, point, dir) {
        let w = matrix.length;
        let h = matrix[0].length;

        let clear = true;

        //Check one unit ahead
        let ahead = $VECTOR.add(dir, point);

        //Doesn't hit boundary
        if (!(ahead.x <= -1 || ahead.x >= w-1 || ahead.y <= -1 || ahead.y >= h-1)) {
            //Hits path
            if (matrix[ahead.x][ahead.y] !== $CHARS.void) {
                clear = false;
            }
        }

        return clear;
    }
    
    availableDirections (matrix, point) {
        //Get available $DIRECTIONS
        let available = [];
        for (let i = 0; i < $DIRECTIONS.length; i++) {

            //If no path in two spaces ahead
            if (this.clearAhead(matrix, point, $DIRECTIONS[i]) && this.clearAhead(matrix, $VECTOR.add(point, $DIRECTIONS[i]), $DIRECTIONS[i])) {
                //Add direction to available $DIRECTIONS
                available.push($DIRECTIONS[i]);
            }

        }
        return available;
    }

    //For debugging
    print (matrix) {
        let w = matrix.length;
        let h = matrix[0].length;
        //Need to flip x and y so not printed rotated
        for (let y = 0; y < h; y++) {
            let row = '';
            for (let x = 0; x < w; x++) {
                row = row.concat(matrix[x][y]);
            }
            console.log(row);
        }
        console.log('');
    }

}

//EXPORTS
module.exports = WorldGen;