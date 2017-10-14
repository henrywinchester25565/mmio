//Used to map world to canvas
"use strict";

class Camera {

    //Static constant for # units min side equals
    get units () {
        return 10;
    }

    constructor(world, canvas) {
        //Important fields
        this.world = world;
        this.stage = new createjs.Stage(canvas);
        this.canvas = '#' + canvas;
        this.target = {x: 0, y: 0};

        //Canvas init
        this.drawCanvas();
        $( window ).resize(this.drawCanvas);

        createjs.Ticker.framerate = 1; //FPS
        createjs.Ticker.addEventListener("tick", this.stage);

        let self = this;
        function onTick (event) {
            if (!event.paused) {
                self.draw();
            }
        }
        createjs.Ticker.addEventListener("tick", onTick);
    }

    //Setting up canvas and units
    drawCanvas () {
        this.w = window.innerWidth;
        this.h = window.innerHeight;
        $(this.canvas).attr('width', this.w).attr('height', this.h);
        let min = Math.min(this.w, this.h);
        this.u2p = min / this.units; //For conversion from units to pixels
    }

    //redrawing all graphics might be bad on the processor, so I'll try and figure out a way around it, using tweens maybe
    draw () {
        //center target and set origin for camera (ox, and oy)
        //converts camera scale to units world scale
        let ox = this.target.x - (this.w / (2*this.u2p));
        let oy = this.target.y - (this.h / (2*this.u2p));
        let chunk = this.world.getChunk(this.target.x, this.target.y); //Only draws chunk target is in for now, should draw all chunks camera is in tho

        //clearing stage
        this.stage.clear();

        for (let i = 0; i < chunk.children.length; i++) {
            if (typeof chunk.children[i].getGraphic() !== 'undefined') {
                let graphic = chunk.children[i].getGraphic(this.u2p);
                //Gives graphic its canvas relative x and y
                graphic.x = (chunk.children[i].x - ox) * this.u2p;
                graphic.y = (chunk.children[i].y - oy) * this.u2p;
                this.stage.addChild(graphic); //Might give graphics an id so I can update them without deleting and removing them
            }
        }

    }
}