//GAME.JS FOR CLIENT SIDE
//INFORMATION
/*
    ASSETS:
    > The use of word 'asset' may refer to the name of an asset as it is stored in a table
    > The following asset 'types' exist:
        > 'obj' - Refers to a THREE Object3D instance
        > 'mat' - Refers to a THREE material instance
        > 'tex' - Refers to a THREE texture instance

    TIME:
    > THREE's clock works in seconds, so time values must be converted to seconds
*/

const updateTime = 0.050; //~ s between updates

/*
  ________      ________ _   _ _______ _____
 |  ____\ \    / /  ____| \ | |__   __/ ____|
 | |__   \ \  / /| |__  |  \| |  | | | (___
 |  __|   \ \/ / |  __| | . ` |  | |  \___ \
 | |____   \  /  | |____| |\  |  | |  ____) |
 |______|   \/   |______|_| \_|  |_| |_____/

*/

//FOR EVENT HANDLING
class EventHandler {

    constructor () {
        this.events = {};
    }


    //Add event listener
    on (event, callback) {
        //Add event to events object
        if (this.events[event] !== undefined) {
            this.events[event].push(callback);
        }
        else {
            this.events[event] = [callback];
        }
    }

    //Add one-shot event listener
    once (event, callback) {
        callback.once = true;
        this.on(event, callback);
    }

    //Call event
    emit (event, ...args) {
        //Call callbacks and remove one-shots
        if (this.events[event] !== undefined) {
            let callbacks = this.events[event];
            for (let i = 0; i < callbacks.length; i++) {
                let callback = callbacks[i];
                callback.apply(null, args);
                if (callback.once) {

                }
            }
        }
    }

    //Remove callback from event
    remove (event, callback) {
        if (this.events[event] !== undefined) {
            let callbacks = this.events[event];
            let index = callbacks.indexOf(callback);
            if (index > -1) {
                //Remove callback
                callbacks.splice(index, -1);
            }
            if (callbacks.length <= 0) {
                //Delete event
                delete this.events[event];
            }
        }
    }

}

/*
  _____  ______  _____  ____  _    _ _____   _____ ______  _____
 |  __ \|  ____|/ ____|/ __ \| |  | |  __ \ / ____|  ____|/ ____|
 | |__) | |__  | (___ | |  | | |  | | |__) | |    | |__  | (___
 |  _  /|  __|  \___ \| |  | | |  | |  _  /| |    |  __|  \___ \
 | | \ \| |____ ____) | |__| | |__| | | \ \| |____| |____ ____) |
 |_|  \_\______|_____/ \____/ \____/|_|  \_\\_____|______|_____/

 */

//MANAGER
const manager = new THREE.LoadingManager();

//On progress
manager.onProgress = function (xhr) {
    //xhr is an XMLHttpRequest instance containing details of loading progress
    console.log( (xhr.loaded / xhr.total * 100) + '% loaded' );
    return xhr.loaded/xhr.total;
};

//On error
manager.onError = function (err) {
    console.error('> Error: ', err);
};

//LOADERS
const loaderObj = new THREE.ObjectLoader(manager);
const loaderMat = new THREE.MaterialLoader(manager);
const loaderTex = new THREE.TextureLoader(manager);

//ASSET LOCATIONS
const assetQueue = [];

//ASSET REFERENCE TABLES
const objects   = { default: new THREE.Object3D()                           };
const materials = { default: new THREE.MeshBasicMaterial({color: 0xfefeff}) };
const textures  = { default: new THREE.Texture()                            };

//ASSET LOADING
function loadAssets () {

    'use strict'; //Strict mode

    //Load queued assets and create references
    for (let i = 0; i < assetQueue.length; i++) {
        let asset = assetQueue[i];
        //Load asset and create reference
        switch (asset.type) {
            case 'obj':
                loaderObj.load(asset.location,
                    function (obj) {
                        objects[asset.name] = obj;
                    });
                break;
            case 'mat':
                loaderMat.load(asset.location,
                    function (mat) {
                        materials[asset.name] = mat;
                    });
                break;
            case 'tex':
                loaderTex.load(asset.location,
                    function (tex) {
                        textures[asset.name] = tex;
                    });
                break;
        }
    }

}

/*
  ______  _   _  _______  _____  _______ __     __
 |  ____|| \ | ||__   __||_   _||__   __|\ \   / /
 | |__   |  \| |   | |     | |     | |    \ \_/ /
 |  __|  | . ` |   | |     | |     | |     \   /
 | |____ | |\  |   | |    _| |_    | |      | |
 |______||_| \_|   |_|   |_____|   |_|      |_|

*/

/* ### ALL BELOW REQUIRES ASSETS TO HAVE BEEN LOADED ### */

//CLASSES ONLY

//ENTITIES TABLE
const entities = {};

//ENTITY BASE CLASS
class Entity {

    //Entity type
    static get type () {
        return 'entity';
    }

    constructor (id, x, y) {
        this.id = id;
        this.x = x;
        this.y = y;
        this.z = 0;
        this.asset = 'default';
        this.events = new EventHandler();
        this.alive = true;
    }

    //Called to initialise THREE Object3D
    //Generic version, should be fine for most cases
    init (asset) {
        let name = asset || this.asset || 'default';
        let mesh = objects[name].clone();
        mesh.position.set(this.x, this.y, this.z);
        this.obj = mesh;
        return mesh;
    }

    //EVENT WRAPPERS
    //Called after added to scene
    spawned () {
        this.events.emit('spawned');
    }

    //Called after entity removed from game
    kill () {
        this.events.emit('kill');
        this.alive = false; //After finished handling calls
    }

    //Called when entity updated by server
    update (scrape) {
        this.events.emit('update', scrape);
    }

    //Called when THREE animates
    draw (dt) {
        this.events.emit('draw', dt);
    }

    //FOR ENTITY PRODUCTION
    //Produces entity from scrape
    //Should be defined for every entity
    static fromScrape (scrape) {
        return new Entity(scrape.x, scrape.y, scrape.id);
    }

    //Takes an entity scrape of unknown type and produces an entity
    static entityFromScrape (scrape) {
        //If the entity exists
        if (entities.hasOwnProperty(scrape.type)) {
            return entities[scrape.type].fromScrape(scrape);
        }
        //Else
        return null;
    }

}
entities[Entity.type] = Entity;

//LIGHT
class Light extends Entity {

    static get type () {
        return 'light';
    }

    constructor (id, x, y, intensity, color, distance) {
        super(id, x, y);

        this.z = 2.4;
        this.intensity = intensity || 0.4;
        this.color = color         || 0xffffff;
        this.distance = distance   || 20;
    }

    init () {
        let mesh = new THREE.PointLight(this.color, this.intensity, this.distance, 2);
        mesh.position.set(this.x, this.y, this.z);
        mesh.castShadow = true;
        mesh.shadow.mapSize.width = 1024;
        mesh.shadow.mapSize.height = 1024;
        this.obj = mesh;
        return mesh;
    }

    static fromScrape (scrape) {
        return new Light(scrape.id, scrape.x, scrape.y, scrape.intensity, scrape.color, scrape.distance);
    }

}
entities[Light.type] = Light;

//WALL
class Wall extends Entity {

    static get type () {
        return 'wall';
    }

    //Wall height (along z-axis)
    static get height () {
        return 2.4;
    }

    static get material () {

        let side = new THREE.MeshPhongMaterial({color:0x191919});
        let top = new THREE.MeshBasicMaterial({color:0x000000});

        let material = [
            side,
            side,
            side,
            side,
            top,
            side
        ];

        return material;
    }

    constructor (id, x, y, w, h) {
        super (id, x, y);

        this.w = w;
        this.h = h;
        this.z = 1/2 * Wall.height - 0.1;
    }

    init () {
        let geo = new THREE.BoxBufferGeometry(this.w, this.h, Wall.height + 0.1);
        let mat = Wall.material;
        let mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(this.x + 0.5*this.w, this.y + 0.5*this.h, Wall.height/2 - 0.1);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        this.obj = mesh;
        return mesh;
    }

    static fromScrape (scrape) {
        return new Wall(scrape.id, scrape.x, scrape.y, scrape.w, scrape.h);
    }

}
entities[Wall.type] = Wall;

//DYNAMIC ENTITY BASE CLASS
class Dynamic extends Entity {

    static get type () {
        return 'dynamic';
    }

    constructor (id, x, y, angle) {
        super (id, x, y);

        this.a = angle || 0;
        this.health = 1; //Percentage

        //hud radius = hudRadius/camera.z
        this.hudRadius = 500;

        //INTERPOLATION
        this.end = {x: this.x, y: this.y, a: this.a};
        this.vel = {x: 0, y: 0, a: 0};

        let self = this;
        //Event listeners to update and animate position
        this.events.on('update', function (scrape) {
            //Move to end state
            self.x = self.end.x;
            self.y = self.end.y;
            self.a = self.end.a;

            //Update end state
            self.end.x = scrape.x;
            self.end.y = scrape.y;
            self.end.a = scrape.a || 0;

            //Calculate velocity
            self.vel.x = (self.end.x - self.x)/updateTime;
            self.vel.y = (self.end.y - self.y)/updateTime;
            self.vel.a = (self.end.a - self.a)/updateTime;

            if (self.health !== scrape.health) {
                let health = self.health;
                self.health = scrape.health || 1;
                self.events.emit('dHealth', self.health - health); //changed health
            }
        });

        this.events.on('draw', function (dt) {
            //New positions
            self.x = self.x + (self.vel.x * dt);
            self.y = self.y + (self.vel.y * dt);
            self.a = self.a + (self.vel.a * dt);

            //Update graphics
            self.obj.position.x = self.x;
            self.obj.position.y = self.y;
            self.obj.rotation.z = self.a;
        });

        //Draw health bar
        this.events.on('hud', function (camera) {
            if (self.health < 1) {
                let pos2D = camera.positionToCamera(self.x, self.y, 0);
                let ctx = camera.hudMap;

                ctx.strokeStyle = '#ffffff';
                ctx.lineWidth   = 100/camera.z;

                ctx.beginPath();
                let angle = (Math.PI*2)/3 - (self.health * Math.PI * 2/3);
                let start = Math.PI/6 + angle/2;
                let end   = (Math.PI * 5)/6 - angle/2;
                ctx.arc(pos2D.x, pos2D.y, self.hudRadius/camera.z, start, end);
                ctx.stroke();
            }
        });
    }

    hud (camera) {
        this.events.emit('hud', camera);
    }

    static fromScrape (scrape) {
        return new Dynamic(scrape.id, scrape.x, scrape.y, scrape.a);
    }

}
entities[Dynamic.type] = Dynamic;

//PHYSICS
//For representation of physics base class
class Physics extends Dynamic {

    static get type () {
        return 'phys';
    }

    constructor (id, x, y) {
        super(id, x, y);

        let self = this;
        this.events.on('kill', function () {
            self.obj.material.emissiveIntensity = 0;
            self.obj.geometry.dispose();
            self.obj.material.dispose();
        });
    }

    init () {
        let geo = new THREE.CylinderBufferGeometry(0.15, 0.15, 0.3);
        geo.rotateX(Math.PI/2);
        let mat = new THREE.MeshPhongMaterial();
        let obj = new THREE.Mesh(geo, mat);
        obj.receiveShadow = true;
        this.obj = obj;
        return obj;
    }

    static fromScrape (scrape) {
        return new Physics(scrape.id, scrape.x, scrape.y);
    }

}
entities[Physics.type] = Physics;

//BARREL PROP
//A barrel prop that can be pushed around
class Barrel extends Dynamic {

    static get type () {
        return 'barrel';
    }

    constructor (id, x, y) {
        super(id, x, y);

        let self = this;
    }

    init () {
        let obj = objects['barrel'].clone();
        obj.rotation.x = Math.PI/2;
        obj.rotation.y = Math.PI;
        obj.position.set(this.x, this.y, 0);
        obj.scale.set(1,0.3,1);
        this.obj = obj;
        return obj;
    }

    static fromScrape (scrape) {
        return new Barrel(scrape.id, scrape.x, scrape.y);
    }

}
entities[Barrel.type] = Barrel;

//WOLF CLASS
class Wolf extends Dynamic {

    static get type () {
        return 'wolf';
    }

    constructor (id, x, y, a) {
        super (id, x, y, a);
    }

    init () {
        let wolf = objects['wolf'].clone();
        wolf.rotation.x = Math.PI/2;
        wolf.rotation.y = Math.PI;

        let obj = new THREE.Group(); //So it rotates properly
        obj.add(wolf);
        obj.position.set(this.x, this.y, 0);
        this.obj = obj;
        return obj;
    }

    static fromScrape (scrape) {
        return new Wolf(scrape.id, scrape.x, scrape.y, scrape.a);
    }

}
entities[Wolf.type] = Wolf;

//PLAYER TOKEN CLASS
//0xef56b4
let colors = [0x5092fc, 0x46ce37, 0xffffff];
class Player extends Dynamic {

    static get type () {
        return 'player';
    }

    constructor (id, x, y, a, nick) {
        super(id, x, y, a);
        this.nick = nick;

        this.hudRadius = 560;

        //0-1 value for ammo and charge
        this.charge = 0;
        this.ammo   = 1;

        let self = this;
        //Change light after health drop
        this.events.on('dHealth', function () {
            let light = self.obj.getObjectByName('light');
            light.intensity = self.health;
            light.distance = 30 * self.health;
        });

        //Nickname
        this.events.on('hud', function (camera) {
            let pos2D = camera.positionToCamera(self.x, self.y, 0);
            let ctx = camera.hudMap;

            //Nickname
            ctx.fillStyle = '#ffffff';
            ctx.font = 'Normal Bold '+320/camera.z+'px Garamond';
            let x = pos2D.x;
            let y = pos2D.y - (800/camera.z);
            ctx.fillText(self.nick, x, y);

            ctx.lineWidth   = 100/camera.z;

            //Ammo
            ctx.strokeStyle = '#5092fc';
            ctx.beginPath();
            let angle = (Math.PI*2)/3 - (self.ammo * Math.PI * 2/3);
            let start = (Math.PI*3)/2 + angle/2;
            let end   = Math.PI/6 - angle/2;
            ctx.arc(pos2D.x, pos2D.y, self.hudRadius/camera.z, start, end);
            ctx.stroke();

            //Charge
            ctx.strokeStyle = '#46ce37';
            ctx.beginPath();
            angle = (Math.PI*2)/3 - (self.charge * Math.PI * 2/3);
            start = (Math.PI*5)/6 + angle/2;
            end   = (Math.PI*3)/2 - angle/2;
            ctx.arc(pos2D.x, pos2D.y, self.hudRadius/camera.z, start, end);
            ctx.stroke();
        });

        //Update extra player stuff
        this.events.on('update', function (scrape) {
            self.ammo = scrape.ammo;
            self.charge = scrape.charge;
        });
    }

    //Temp
    init () {
        let group = new THREE.Group();

        let color = colors[Math.floor(Math.random()*(colors.length - 1))];

        let light = new THREE.PointLight(color, 1, 30, 2);
        light.shadow.mapSize.width = 1024;
        light.shadow.mapSize.height = 1024;
        light.castShadow = true;
        light.position.z = 2.3;
        light.name = 'light';
        group.add(light);

        let char = objects['mage'].clone();
        char.rotation.x = Math.PI/2;
        char.rotation.y = Math.PI;
        char.scale.set(2,2,2);
        let mat = char.getObjectByName('Base').material;
        mat.emissive = new THREE.Color(0xffffff);
        mat.needsUpdate = true;
        group.add(char);

        group.position.set(this.x, this.y, 0);
        this.obj = group;
        return group;
    }

    static fromScrape (scrape) {
        return new Player(scrape.id, scrape.x, scrape.y, scrape.a, scrape.nick)
    }

}
entities[Player.type] = Player;

/*
 __          __ ____   _____   _       _____
 \ \        / // __ \ |  __ \ | |     |  __ \
  \ \  /\  / /| |  | || |__) || |     | |  | |
   \ \/  \/ / | |  | ||  _  / | |     | |  | |
    \  /\  /  | |__| || | \ \ | |____ | |__| |
     \/  \/    \____/ |_|  \_\|______||_____/

*/

//CLASSES ONLY

//FLOOR
//For the bottom of the map
//It doesn't need all the functionality of an entity, and is permanent
class Floor {

    constructor (w, h) {
        this.w = w + 20;
        this.h = h + 20;

        let geo = new THREE.PlaneBufferGeometry(this.w, this.h);

        //Material
        let material = new THREE.MeshPhongMaterial({specular: 0x222222});
        //material.receiveShadow = true;

        let base = textures['floor_base'];
        let normal = textures['floor_normal'];
        let specular = textures['floor_specular'];

        //Base
        if (base !== undefined) {
            base.wrapS = THREE.RepeatWrapping;
            base.wrapT = THREE.RepeatWrapping;
            base.repeat.set( this.w/3, this.h/3);
            material.map = base;
        }

        //Normal
        if (normal !== undefined) {
            normal.wrapS = THREE.RepeatWrapping;
            normal.wrapT = THREE.RepeatWrapping;
            normal.repeat.set( this.w/3, this.h/3);
            material.normalMap = normal;
            material.normalScale.set(1.2, 1.2);
        }

        //Roughness
        if (specular !== undefined) {
            specular.wrapS = THREE.RepeatWrapping;
            specular.wrapT = THREE.RepeatWrapping;
            specular.repeat.set( this.w/3, this.h/3);
            material.specularMap = specular;
        }

        this.obj = new THREE.Mesh(geo, material);
        this.obj.receiveShadow = true;
        this.obj.position.set((this.w/2) - 10, (this.h/2) - 10, 0);
    }

}

//CAMERA
//Displays the world as an HTML canvas
class Camera {

    constructor (height, fov, scene, target) {
        this.x      = 0;
        this.y      = 0;
        this.z      = height;
        this.fov    = fov;
        this.scene  = scene;
        this.target = target; //Tracked by camera

        this.width  = window.innerWidth;
        this.height = window.innerHeight;

        this.renderer = new THREE.WebGLRenderer({antialias: true});
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

        this.renderer.setSize(this.width, this.height);
        this.html = this.renderer.domElement;

        this.camera = new THREE.PerspectiveCamera(fov, this.width/this.height, 0.1, 1000);
        this.update();

        //HEADS UP DISPLAY (HUD)
        //Renders bitmap images onto canvas and renders over the top of 3D camera
        //Adapted from https://www.evermade.fi/pure-three-js-hud/
        this.hudCanvas = document.createElement('canvas');
        this.hudCanvas.style.position = 'relative';
        this.hudCanvas.style.top      = (this.height * -1) + 'px';
        this.hudCanvas.style.zIndex  = '1000';

        this.hudCanvas.width  = this.width;
        this.hudCanvas.height = this.height;
        this.hudMap           = this.hudCanvas.getContext('2d');

        this.hudMap.textAlign = 'center';

        //When the window is resized...
        let self = this;
        window.addEventListener('resize', function () {
            self.width = window.innerWidth;
            self.height = window.innerHeight;

            self.camera.aspect = self.width / self.height;
            self.camera.updateProjectionMatrix();

            self.hudCanvas.width = self.width;
            self.hudCanvas.height = self.height;
            self.hudCanvas.style.top = (self.height * -1) + 'px';

            self.renderer.setSize(self.width, self.height);
        }, false);
    }

    //For HUD rendering
    positionToCamera (x, y, z) {
        //3D position to Camera
        let pos = new THREE.Vector3(x, y, z);
        let vector = pos.project(this.camera);

        vector.x = (vector.x + 1) / 2 * this.width;
        vector.y = -(vector.y - 1) / 2 * this.height;
        return vector;
    }

    update () {
        if (this.target !== undefined) {
            this.x = this.target.x;
            this.y = this.target.y;
        }
        else {
            this.x = 0;
            this.y = 0;
        }
        this.camera.position.set(this.x, this.y, this.z);
    }

    render () {
        //3D
        this.renderer.render(this.scene, this.camera);
    }

}

//WORLD
//Updates and animates entities
class World {

    static get cameraHeight () {
        return 10;
    }

    static get fov () {
        return 75;
    }

    constructor (w, h) {
        this.w = w;
        this.h = h;

        this.children = {};

        this.scene = new THREE.Scene();
        this.camera = new Camera(World.cameraHeight, World.fov, this.scene);

        this.floor = new Floor(w, h);
        this.scene.add(this.floor.obj);

        //MOUSE TRACKING
        this.mouseScreen = new THREE.Vector2();
        this.mouse = new THREE.Vector2();
        this.raycaster = new THREE.Raycaster();

        let self = this;
        window.addEventListener('mousemove', function (event) {
            //From https://threejs.org/docs/#api/core/Raycaster
            self.mouseScreen.x = ( event.clientX / self.camera.width ) * 2 - 1;
            self.mouseScreen.y = - ( event.clientY / self.camera.height ) * 2 + 1;
        }, false );

        //ZOOM TRACKING
        window.addEventListener('wheel', function (event) {
            let dy = event.deltaY / 100;
            self.camera.z = self.camera.z + dy;
            //Clip
            if (self.camera.z < 6) {
                self.camera.z = 6;
            }
            else if (self.camera.z > 30) {
                self.camera.z = 30;
            }

        }, false);

        //START ANIMATION
        this.clock = new THREE.Clock();
        this.start();
    }

    //CHILDREN
    //Store children in table by UUID's
    addChild (child) {
        if (!this.children.hasOwnProperty(child.id)) {
            this.children[child.id] = child;
            let obj = child.init();
            this.scene.add(obj);
        }
        else {
            console.error('> Error: Unable to add child to world - child already exists');
        }
    }

    //Delete from world
    removeChild (id) {
        if (this.children.hasOwnProperty(id)) {
            //If removing being called quickly, sometimes doesn't work, so repeat until it does
            while (this.scene.getObjectById(this.children[id].obj.id)) {
                this.scene.remove(this.children[id].obj);
            }
            delete this.children[id];
        }
    }

    //Returns only children from children table, and as an array
    getChildren () {
        let children = [];
        for (let id in this.children) {
            if (this.children.hasOwnProperty(id)) {
                children.push(this.children[id]);
            }
        }
        return children;
    }

    //ANIMATION
    //Animation controls (doesn't affect updates from server)
    start () {
        this.running = true;
        
        let self = this;
        let animate = function () {
            if (self.running) {

                requestAnimationFrame(animate);
                self.camera.hudMap.clearRect(0, 0, self.camera.width, self.camera.height);

                let children = self.getChildren();
                for (let i = 0; i < children.length; i++) {
                    if (children[i].alive) {
                        children[i].draw(self.clock.getDelta());
                    }
                    //Remove dead children
                    else {
                        self.removeChild(children[i].id);
                    }
                }

                //UPDATE MOUSE LOCATION
                //Ray from camera
                self.raycaster.setFromCamera( self.mouseScreen, self.camera.camera );

                //Where the ray intersects the floor (the 2D plane everything occurs on)
                let intersect = self.raycaster.intersectObject(self.floor.obj);
                if (intersect.length > 0) {
                    let point = intersect[0].point;
                    self.mouse.x = point.x;
                    self.mouse.y = point.y;
                }

                self.camera.update();
                self.camera.render();

                //Render HUD
                for (let i = 0; i < children.length; i++) {
                    if (children[i].alive && children[i].hud) {
                        //Render HUD Elements
                        children[i].hud(self.camera);
                    }
                }

            }
        };

        animate();
    }

    stop () {
        this.running = false;
    }

    //Camera target
    set target (target) {
        this.camera.target = target;
    }

    get target () {
        return this.camera.target;
    }

    //NETWORKING
    update (scrapes) {
        for (let i = 0; i < scrapes.length; i++) {
            let scrape = scrapes[i];

            //Update existing entities
            if (this.children.hasOwnProperty(scrape.id)) {
                let child = this.children[scrape.id];
                child.update(scrape);
                if (!scrape.alive) {
                    child.kill();
                }
            }

            //Add new entities
            else {
                let entity = Entity.entityFromScrape(scrape);
                if (entity !== null) {
                    this.addChild(entity);
                }
            }

        }
    }

    //Create from a world scrape
    static fromScrape (scrape) {
        let world = new World(scrape.w, scrape.h);

        //Adds all the scrapes children to the world
        for (let i = 0; i < scrape.children.length; i++) {
            let child = scrape.children[i]; //The child's scrape
            let entity = Entity.entityFromScrape(child);
            world.addChild(entity); //Add to world
        }
        return world;
    }

}

/*
   _____  ____   _____   ______
  / ____|/ __ \ |  __ \ |  ____|
 | |    | |  | || |__) || |__
 | |    | |  | ||  _  / |  __|
 | |____| |__| || | \ \ | |____
  \_____|\____/ |_|  \_\|______|

*/

//VARIABLES TO BE INITIALISED AFTER LOADING
let socket;
let world;
let player;
let plyId;

//INPUT
let keys = [];
let btns = [];
let inputs = [];

//UPDATE
function update (scrapes) {
    'use strict'; //Strict mode

    world.update(scrapes);
}

//RECEIVE PLAYER ID
function setPlayer (ply) {
    'use strict'; //Strict mode

    //TODO Send only player id
    plyId = ply.id;
}

//WORLD INITIALISATION
function worldInit (scrape) {
    'use strict'; //Strict mode

    console.log('World initialising...');
    
    world = World.fromScrape(scrape);
    player = world.children[plyId];
    world.target = player;
    document.getElementById('render').appendChild(world.camera.html);
    document.getElementById('render').appendChild(world.camera.hudCanvas);

    socket.on('update', update);
}

//INITIALISATION
function init () {
    'use strict'; //Strict mode

    console.log('Starting game...');

    //OPEN SOCKET
    socket = io();
    //EVENTS
    /*
    
        FROM SERVER
        world_init: receives initial world scrape
        update: receives snapshot from server
        ply: receives the players id
    
        TO SERVER
        input: sends the client input
    
    */

    socket.on('username', function () {
        socket.emit('username', Math.floor(30*Math.random()));
    });
    
    //INITIALISE WORLD
    socket.on('world_init', worldInit);

    //PREPARE FOR PLAYER
    socket.on('ply', setPlayer);
    
    //GET KEYS
    document.addEventListener("keydown", function (event) {
        let index = keys.indexOf(event.code);
        if (index < 0) {
            keys.push(event.code);
        }
    });

    document.addEventListener("keyup", function (event) {
        let index = keys.indexOf(event.code);
        if (index > -1) {
            keys.splice(index, 1);
        }
    });

    //MOUSE is in CAMERA due to requirements of camera raycasting

    //MOUSE BUTTONS
    document.addEventListener('click', function (event) {
        let btn = 'Mouse' + event.button;
        let index = btns.indexOf(btn);
        if (index === -1) {
            btns.push(btn);
        }
    });

    //SEND SERVER INPUTS EVERY 33ms
    window.setInterval(function(){
        inputs = [];
        for (let i = 0; i < keys.length; i++) {
            inputs.push({type: 'key', value: keys[i]});
        }
        for (let i = 0; i < btns.length; i++) {
            inputs.push({type: 'btn', value: btns[i]});
        }
        inputs.push({type: 'mouse', value: {x: world.mouse.x, y: world.mouse.y}});
        socket.emit('input', inputs);
        btns = [];
    }, 33);
    
}

//LOAD ASSETS
manager.onLoad = init;

//ASSETS
assetQueue.push({
    type: 'tex',
    location: 'textures/floor_diffuse.png',
    name: 'floor_base'
});
assetQueue.push({
    type: 'tex',
    location: 'textures/floor_specular.png',
    name: 'floor_specular'
});
assetQueue.push({
    type: 'tex',
    location: 'textures/floor_normal.png',
    name: 'floor_normal'
});
assetQueue.push({
    type: 'obj',
    location: 'models/mage.json',
    name: 'mage'
});
assetQueue.push({
    type: 'obj',
    location: 'models/barrel.json',
    name: 'barrel'
});
assetQueue.push({
    type: 'obj',
    location: 'models/wolf.json',
    name: 'wolf'
});

loadAssets();
//init();