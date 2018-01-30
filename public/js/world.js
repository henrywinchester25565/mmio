//WORLD
const World = {
    create: function (scrape) {
        this.w = scrape.w;
        this.h = scrape.h;

        this.floor = new Floor.create(scrape.w, scrape.h);

        this.children = {};

        this.addChild = function (entity) {
            this.children[entity.id] = entity;
        };

        for (let i = 0; i < scrape.children.length; i++) {
            let ent = entityFromScrape(scrape.children[i]);
            this.addChild(ent);
        }

        let self = this;
        this.getObj3Ds = function () {
            let obj3Ds = [];
            for (let ent in self.children) {
                if (self.children.hasOwnProperty(ent)) {
                    obj3Ds.push(self.children[ent].obj3D);
                }
            }
            return obj3Ds;
        };

        this.update = function (dt) {
            for (let ent in self.children) {
                if (self.children.hasOwnProperty(ent)) {
                    if (self.children[ent].update !== undefined) {
                        self.children[ent].update(dt);
                    }
                }
            }
        };
    }
};