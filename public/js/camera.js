//Used to map world to canvas
"use strict";

const FR = 60;

class Camera {

    //Static constant for # units min side equals
    get units () {
        return 48;
    }

    constructor(world, canvas) {
        let self = this;
        //Important fields
        this.world = world;
        this.stage = new createjs.Stage(canvas);
        this.canvas = '#' + canvas;
        this.target = {x: 0, y: 0};

        //Canvas init
        this.drawCanvas(self);
        window.onresize = function (event) {self.drawCanvas(self);}//TODO remove self


        createjs.Ticker.framerate = FR; //FPS

        function onTick (event) {
            if (!event.paused) {
                self.world.update(event.delta);
                self.draw();
            }
        }
        createjs.Ticker.addEventListener('tick', onTick);
        console.log("Camera ticking...");
        createjs.Ticker.addEventListener('tick', this.stage);
    }

    //Setting up canvas and units
    drawCanvas (self) {
        self.w = window.innerWidth;
        self.h = window.innerHeight;
        $(self.canvas).attr('width', self.w).attr('height', self.h);
        let min = Math.min(self.w, self.h);
        self.u2p = min / self.units; //For conversion from units to pixels
    }

    //redrawing all graphics might be bad on the processor, so I'll try and figure out a way around it, using tweens maybe
    draw () {
        //center target and set origin for camera (ox, and oy)
        //converts camera scale to units world scale
        let ox = this.target.x - (this.w / (2*this.u2p));
        let oy = this.target.y - (this.h / (2*this.u2p));

        //Boundaries
        //TODO make this better
        if (ox < 0) {ox = 0;}
        else if (ox > this.world.w - (this.w /this.u2p)) {ox = this.world.w - (this.w /this.u2p)}
        if (oy < 0) {oy = 0;}
        else if (oy > this.world.h - (this.h /this.u2p)) {oy = this.world.h - (this.h /this.u2p)}

        //TODO delete below line
        //let chunk = this.world.getChunk(this.target.x, this.target.y); //Only draws chunk target is in for now, should draw all chunks camera is in tho
        this.stage.removeAllChildren();

        //Work out chunks to process
        //Steps through each of the chunks the camera is in and adds them to the chunks array
        //TODO tidy this a little
        let chunks = [];
        let cw = (this.w/this.u2p) - (this.w/this.u2p)%Chunk.units + 2*Chunk.units; //chunk width - number of units across
        let ch = (this.h/this.u2p) - (this.h/this.u2p)%Chunk.units + 2*Chunk.units; //chunk height - number of units across
        for (let i = 0; i <= cw; i = i + Chunk.units) {
            for (let j = 0; j <= ch; j = j + Chunk.units) {
                if (this.world.inBounds(ox - Chunk.units + i, oy - Chunk.units + j)) {
                    let chunk = this.world.getChunk(ox - Chunk.units + i, oy - Chunk.units + j);
                    if (typeof chunk !== 'undefined') {chunks.push(chunk);}
                }
            }
        }

        /*let chunks = [];
        for (let i = 0; i < this.world.chunks.length; i++) {
            for (let j = 0; j < this.world.chunks[i].length; j++) {
                chunks.push(this.world.chunks[i][j]);
            }
        }*/

        //console.log(chunks);

        let graphics = [];
        for (let i = 0; i < chunks.length; i++) {
            let chunk = chunks[i];
            for (let j = 0; j < chunk.children.length; j++) {
                if (typeof chunk.children[j].getGraphic !== 'undefined') {
                    let graphic = chunk.children[j].getGraphic(this.u2p);
                    //Gives graphic its canvas relative x and y
                    graphic.x = (chunk.children[j].x - ox) * this.u2p;
                    graphic.y = (chunk.children[j].y - oy) * this.u2p;
                    //this.stage.addChild(graphic); //Might give graphics an id so I can update them without deleting and removing them
                    //TODO the idea is right, but the implementation doesn't work
                    if (typeof graphic.layerWeight === 'undefined') {graphic.layerWeight = 0;}
                    graphics.push(graphic);
                }
            }
        }

        //Render based on layer weight
        let layerWeight = 0;
        while (graphics.length > 0) {
            let g = [];
            for (let i = 0; i < graphics.length; i++) {
                if (graphics[i].layerWeight === layerWeight) {
                    this.stage.addChild(graphics[i]);
                }
                else {
                    g.push(graphics[i]);
                }
            }
            graphics = g;
            layerWeight++;
        }
    }
}