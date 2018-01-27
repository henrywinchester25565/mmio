'use strict';
//VIEW UNITS FOR RESPONSIVE LAYOUT
const $VIEW = {
    vw: 0,
    vh: 0,
    update: function () {
        $VIEW.vw = window.innerWidth / 100;
        $VIEW.vh = window.innerHeight / 100;
    }
};

//CAMERA FOR VIEW MAPPING TO CANVAS
const $CAMERAS = [];
class Camera {

    //Dimensions in view units
    constructor (w, h, canvas, world, target) {
        this.w = w;
        this.h = h;
        this.canvas = canvas;
        this.world = world;
        if (target === undefined) {
            this.target = {x: this.world.w/2};
            this.target = {y: this.world.h/2};
        }
        this.target = target;
        $CAMERAS.push(this);
        $UPDATE_VIEW();
        this.canvas.setAttribute('style', 'display: block');
    }

    draw () {

    }

    updateViewSize () {
        this.canvas.setAttribute('width', this.w * $VIEW.vw);
        this.canvas.setAttribute('height', this.h * $VIEW.vh);
    }

}

//HANDLING VIEWPORT RESIZE
const $UPDATE_VIEW = function () {
    $VIEW.update();
    for (let i = 0; i < $CAMERAS.length; i++) {
        $CAMERAS[i].updateViewSize();
    }
};
window.onresize = $UPDATE_VIEW;

//Initial view
$UPDATE_VIEW();