class World {

    //width and height => w, h
    constructor (w, h) {
        this.w = w;
        this.h = h;
        this.children = [];
    }

    getWidth () {
        return this.w;
    }
    setWidth (w) {
        this.w = w;
    }

    getHeight () {
        return this.h;
    }
    setHeight (h) {
        this.h = h;
    }

    addChild (child) {
        this.children.push(child);
        child.world = this;
    }
    removeChild (child) {
        var index = this.children.indexOf(child);
        if (index > -1) {
            this.children.splice(index, 1);
            child.world = null;
        }
    }

}