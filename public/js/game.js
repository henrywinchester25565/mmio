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
        console.log(this.id, this.alive, 'kill');
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

        this.a = angle;

        //INTERPOLATION
        this.end = {x: this.x, y: this.y, a: this.a};
        this.vel = {x: 0, y: 0, a: 0};

        let self = this;
        //Event listeners to update and animate position
        //TODO Smoother interpolation
        this.events.on('update', function (scrape) {
            //Move to end state
            self.x = self.end.x;
            self.y = self.end.y;
            self.a = self.end.a;

            //Update end state
            self.end.x = scrape.x;
            self.end.y = scrape.y;
            self.end.a = scrape.a;

            //Calculate velocity
            self.vel.x = (self.end.x - self.x)/updateTime;
            self.vel.y = (self.end.y - self.y)/updateTime;
            self.vel.a = (self.end.a - self.a)/updateTime;

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

    constructor (id, x, y, a) {
        super (id, x, y, a);
    }

    init () {
        let light = new THREE.PointLight(0x3C98EB, 3, 8, 2);
        light.shadow.mapSize.width = 1024;
        light.shadow.mapSize.height = 1024;
        light.castShadow = true;
        light.position.z = 0.3;

        let obj = new THREE.Group();
        obj.add(light);
        obj.position.set(this.x, this.y, 0);

        this.obj = obj;
        return obj;
    }

    static fromScrape (scrape) {
        return new Physics(scrape.id, scrape.x, scrape.y, scrape.a);
    }

}
entities[Physics.type] = Physics;

//PLAYER GAME CLASSES
const plyClasses = {
    default: {
        type: 'default',
        asset: 'ply_class_default',
        stats: {
            health: 100,
            stamina: 100,
            ammo: 3
        }
    }
};

//PLAYER TOKEN CLASS
let colors = [0x5092fc, 0xe82c57, 0x46ce37, 0xef56b4, 0xffffff];
class Player extends Dynamic {

    static get type () {
        return 'player';
    }

    constructor (id, x, y, a, r) {
        super(id, x, y, a);

        this.radius = r;
    }

    //Temp
    init () {
        let group = new THREE.Group();

        let color = colors[Math.floor(Math.random()*(colors.length - 1))];

        let light = new THREE.PointLight(color, 1, 30, 2);
        light.shadow.mapSize.width = 1024;
        light.shadow.mapSize.height = 1024;
        light.castShadow = true;
        light.position.z = 2;
        group.add(light);

        let char = objects['mage'].clone();
        char.rotation.x = Math.PI/2;
        char.rotation.y = Math.PI;
        char.scale.set(2,2,2);
        let mat = char.getObjectByName('Base').material;
        mat.emissive = color;
        mat.needsUpdate = true;
        group.add(char);

        group.position.set(this.x, this.y, 0);
        this.obj = group;
        return group;
    }

    static fromScrape (scrape) {
        return new Player(scrape.id, scrape.x, scrape.y, scrape.a, scrape.r)
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

        //When the window is resized...
        let self = this;
        window.addEventListener('resize', function () {
            self.width = window.innerWidth;
            self.height = window.innerHeight;

            self.camera.aspect = self.width / self.height;
            self.camera.updateProjectionMatrix();

            self.renderer.setSize(self.width, self.height);
        }, false);

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
            console.log(dy);
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
            this.scene.remove(this.children[id]);
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
        socket.emit('username', Math.random());
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

    //GET MOUSE
    //TODO

    //SEND SERVER INPUTS EVERY 33ms
    window.setInterval(function(){
        inputs = [];
        for (let i = 0; i < keys.length; i++) {
            inputs.push({type: 'key', value: keys[i]});
        }
        inputs.push({type: 'mouse', value: {x: world.mouse.x, y: world.mouse.y}});
        socket.emit('input', inputs)
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

loadAssets();
//init();