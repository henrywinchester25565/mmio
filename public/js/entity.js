//From scraped entities
function entityFromScrape (scrape) {
    return entity[scrape.type].fromScrape(scrape);
}

//For materials
/*const textureLoader = new THREE.TextureLoader();
const textures = {
    floor_matte: textureLoader.load('textures/floor_base.png'),
    floor_normal: textureLoader.load('textures/floor_normal.png'),
    floor_roughness: textureLoader.load('textures/floor_roughness.png')
};*/

//ENTITIES
//Active entities, for anything from the server
const entities = {};

//WALL
let wall_material_side =  new THREE.MeshStandardMaterial({color: 0x0202020});
let wall_material_top =  new THREE.MeshBasicMaterial({color: 0x000000});
const Wall = {
    material:
        [
            wall_material_side,
            wall_material_side,
            wall_material_side,
            wall_material_side,
            wall_material_top,
            wall_material_side
        ],
    height: 1.4,
    create:
        function (x, y, w, h, id) {
            this.x = x;
            this.y = y;
            this.w = w;
            this.h = h;
            this.id = id;
            let geometry = new THREE.BoxBufferGeometry(w, h, Wall.height + 0.1);
            this.obj3D = new THREE.Mesh(geometry, Wall.material);
            this.obj3D.position.set(this.x + 0.5*w, this.y + 0.5*h, Wall.height/2 - 0.1);
            this.obj3D.castShadow = true;
            this.obj3D.receiveShadow = true;

            let self = this;
            this.update = function (x, y) {
                self.x = x;
                self.y = y;
                self.obj3D.position.x = x + 0.5*w;
                self.obj3D.position.y = y + 0.5*h;
            };

            entities[this.id] = this;
        },
    fromScrape:
        function (scrape) {
            return new Wall.create(scrape.x, scrape.y, scrape.w, scrape.h, scrape.id);
        }
};

//FLOOR
const Floor = {
    create:
        function (w, h) {
            this.w = w;
            this.h = h;

            //Creating material
            let material = new THREE.MeshStandardMaterial({color: 0xffffff});

            //Setting up textures and tiling
            /*let matte = textures.floor_matte.clone();
            matte.needsUpdate = true;
            matte.wrapS = THREE.RepeatWrapping;
            matte.wrapT = THREE.RepeatWrapping;
            matte.repeat.set(w/2, h/2);

            let normal = textures.floor_normal.clone();
            normal.needsUpdate = true;
            normal.wrapS = THREE.RepeatWrapping;
            normal.wrapT = THREE.RepeatWrapping;
            normal.repeat.set(w/2, h/2);

            let roughness = textures.floor_roughness.clone();
            roughness.needsUpdate = true;
            roughness.wrapS = THREE.RepeatWrapping;
            roughness.wrapT = THREE.RepeatWrapping;
            roughness.repeat.set(w/2, h/2);

            //Applying textures to material
            material.map = matte;
            material.normalMap = normal;
            material.normalScale.set(0.2, 0.2);
            material.roughnessMap = roughness;*/

            let geometry = new THREE.PlaneBufferGeometry(w, h);
            this.obj3D = new THREE.Mesh(geometry, material);
            this.obj3D.position.set(w/2, h/2, 0);
            this.obj3D.receiveShadow = true;
        }
};

//LIGHT
const Light = {
    create:
        function (x, y, color, intensity, id, dist, z) {
            this.x = x;
            this.y = y;
            this.z = z || 1;
            this.id = id;

            this.color = color;
            this.intensity = intensity;
            this.distance = dist;
            this.obj3D = new THREE.PointLight(color, intensity, dist);
            this.obj3D.position.set(x, y, this.z);
            this.obj3D.castShadow = true;
            this.obj3D.shadow.mapSize.width = 2048;
            this.obj3D.shadow.mapSize.height = 2048;
            //this.obj3D.shadow.bias = 0.0001;

            entities[this.id] = this;
        },
    fromScrape:
        function (scrape) {
            return new Light.create(scrape.x, scrape.y, scrape.color, scrape.intensity, scrape.id, scrape.distance, scrape.z);
        }
};

//DYNAMIC
const Dynamic = {
    material: new THREE.MeshStandardMaterial({color: 0xffffff}),
    create:
        function (x, y, r, id) {
            this.x = x;
            this.y = y;
            this.r = r;
            this.id = id;

            this.velocity = {x: 0, y:0};
            this.end = {x: 0, y: 0};
            //this.last = 0;

            let self = this;
            //Update
            this.update = function (x, y) {
                self.last = 0;
                self.x = self.end.x;
                self.y = self.end.y;
                self.obj3D.position.x = self.x;
                self.obj3D.position.y = self.y;

                self.end = {x: x, y: y};
                self.velocity = {x: (self.end.x-self.x)/0.1, y: (self.end.y-self.y)/0.1};
            };

            //Animate
            this.animate = function (dt) {
                self.x = self.x + self.velocity.x*dt;
                self.y = self.y + self.velocity.y*dt;
                self.obj3D.position.x = self.x;
                self.obj3D.position.y = self.y;
            };

            let geo = new THREE.CylinderBufferGeometry(r, r, r + 0.1, 32);
            geo.rotateX(Math.PI/2);
            this.obj3D = new THREE.Mesh(geo, Dynamic.material);
            this.obj3D.castShadow = true;
            this.obj3D.receiveShadow = true;
            this.obj3D.position.set(this.x, this.y, r/2 - 0.1);
        },
    fromScrape:
        function (scrape) {
            return new Dynamic.create(scrape.x, scrape.y, scrape.r, scrape.id);
        }
        
};

//ENTITY
//In object for access reasons
//e.g Use entities[entity.type] to access entity class
const entity = {
    wall: Wall,
    light: Light,
    phys: Dynamic
};