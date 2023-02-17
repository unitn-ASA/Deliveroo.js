// import * as io from 'socket.io';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { CSS2DRenderer, CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';



const scene = new THREE.Scene();

// const camera = new THREE.OrthographicCamera( -100, 100, 10, -10, 1, 100 );
const camera = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 0.1, 100 );
camera.position.set(-2, 10, +10);

const renderer = new THREE.WebGLRenderer();
renderer.setSize( window.innerWidth, window.innerHeight );
document.body.appendChild( renderer.domElement );

const labelRenderer = new CSS2DRenderer();
labelRenderer.setSize( window.innerWidth, window.innerHeight );
labelRenderer.domElement.style.position = 'absolute';
labelRenderer.domElement.style.top = '0px';
document.body.appendChild( labelRenderer.domElement );

const controls = new OrbitControls( camera, labelRenderer.domElement );
controls.minDistance = 5;
controls.maxDistance = 100;
controls.target.set(0, 0, 0);
controls.update();


// for (var x=0; x<10; x++) {
//     for (var y=0; y<10; y++) {
//         addTile(x, y);
//     }
// }


function animate() {
    requestAnimationFrame( animate );

    // cube.rotation.x += 0.01;
    // cube.rotation.y += 0.01;

	// required if controls.enableDamping or controls.autoRotate are set to true
	controls.update();

    renderer.render( scene, camera );
    labelRenderer.render( scene, camera );
}
animate();


// const geometry = new THREE.ConeGeometry( 0.5, 1, 32 );
// const material = new THREE.MeshBasicMaterial( { color: 0xffff00 } );
// const my_mesh = new THREE.Mesh( geometry, material );
// my_mesh.position.x = 1 * 1.5;
// my_mesh.position.y = 0.5;
// my_mesh.position.z = 1 * 1.5;
// // my_mesh.rotation.x = 90;
// scene.add( my_mesh );






class onGrid {
    
    #mesh

    #x
    get x () {
        return this.#x
    }
    set x (x) {
        this.#x = x
        this.#mesh.position.x = x * 1.5
    }

    #y
    get y () {
        return this.#y
    }
    set y (y) {
        this.#y = y
        this.#mesh.position.z = -y * 1.5
    }

    #agent
    pickup ( agent ) {
        this.#agent = agent;
        this.#agent.#mesh.add( this.#mesh );
        this.#agent.carrying.set(this.id, this);
        scene.remove( this.#mesh );
        this.x = 0
        this.y = 0
        this.#mesh.position.y = this.#agent.carrying.size * 0.5;
    }
    putdown () {
        this.#agent.#mesh.remove( this.#mesh );
        this.#agent.carrying.delete(this.id);
        this.opacity = 1;
        this.x = this.#agent.x;
        this.y = this.#agent.y;
        this.#mesh.position.y = 0.5;
        this.#agent = undefined;
        scene.add( this.#mesh );
    }
    get carriedBy () {
        return this.#agent;
    }

    set opacity (opacity) {
        this.#mesh.material.opacity = opacity;
        this.#label.element.style.visibility  = ( opacity == 0 ? "hidden" : "visible" );
    }

    #text
    get text () {
        return this.#text
    }
    set text (text) {
        this.#text = text
        this.#div.textContent = text
    }

    #div
    #label

    constructor (mesh, x, y, text = null) {

        this.#mesh = mesh
        this.#mesh.position.y = 0.5
        this.x = x
        this.y = y
    
        const div = this.#div = document.createElement( 'div' );
        div.className = 'label';
        div.textContent = text;
        div.style.marginTop = '-1em';
    
        const label = this.#label = new CSS2DObject( div );
        label.position.set( 0, 0, 0 );
        label.layers.set( 0 );
        if ( text ) mesh.add( label );
    }

    removeMesh () {
        this.#mesh.remove( this.#label );
        this.#mesh.geometry.dispose();
        this.#mesh.material.dispose();
        scene.remove( this.#mesh );
        renderer.renderLists.dispose();
    }

}

const tiles = new Map();

class Tile extends onGrid {

    delivery = false;
    
    constructor (x, y, delivery) {
        const geometry = new THREE.BoxGeometry( 1, 0.1, 1 );
        const color = delivery ? 0xff0000 : 0x00ff00;
        const material = new THREE.MeshBasicMaterial( { color, transparent: true, opacity: 1 } );
        const cube = new THREE.Mesh( geometry, material );
        scene.add( cube );

        super(cube, x, y);
        cube.position.y = 0;
        this.delivery = delivery;
    }

}

function setTile(x, y, delivery) {
    // const geometry = new THREE.BoxGeometry( 1, 0.1, 1 );
    // const color = delivery ? 0xff0000 : 0x00ff00;
    // const material = new THREE.MeshBasicMaterial( { color } );
    // const cube = new THREE.Mesh( geometry, material );
    // cube.position.x = x*1.5;
    // cube.position.z = -y*1.5;
    // tiles.set( x + y*1000, cube )
    // scene.add( cube );

    if ( !tiles.has(x + y*1000) )
        tiles.set( x + y*1000, new Tile(x, y, delivery) );
    return tiles.get( x + y*1000 );
}



var parcels = new Map();

class Parcel extends onGrid {

    id

    #reward
    get reward () {
        return this.#reward
    }
    set reward (reward) {
        this.#reward = reward
        this.text = reward;
    }

    constructor (id, reward, x, y) {
        const geometry = new THREE.BoxGeometry( 0.5, 0.5, 0.5 );
        var color = new THREE.Color( 0xffffff );
        color.setHex( Math.random() * 0xffffff );
        const material = new THREE.MeshBasicMaterial( { color, transparent: true, opacity: 1 } );
        const parcel = new THREE.Mesh( geometry, material );
        scene.add( parcel );

        super(parcel, x, y, reward)
        parcels.set(id, this);

        this.id = id
        this.#reward = reward

        // console.log('created parcel', id)
    }

}



var agents = new Map();

class Agent extends onGrid {

    id
    carrying = new Map();

    #score
    get score () {
        return this.#score
    }
    set score (score) {
        this.#score = score
        this.text = this.id+'\n'+score;
    }

    constructor (id, x, y, score) {
        const geometry = new THREE.ConeGeometry( 0.5, 1, 32 );
        var color = new THREE.Color( 0xffffff );
        color.setHex( Math.random() * 0xffffff );
        const material = new THREE.MeshBasicMaterial( { color, transparent: true, opacity: 1 } );
        const agent = new THREE.Mesh( geometry, material );
        scene.add( agent );

        super(agent, x, y, id+'\n'+score)
        agents.set(id, this);

        this.id = id
        this.#score = score
    }

}

// function createAgent (id) {
//     const geometry = new THREE.ConeGeometry( 0.5, 1, 32 );
//     var color = new THREE.Color( 0xffffff );
//     color.setHex( Math.random() * 0xffffff );
//     const material = new THREE.MeshBasicMaterial( { color, transparent: true, opacity: 0.1 } );
//     const agent = new THREE.Mesh( geometry, material );
//     agent.position.x = 1 * 1.5;
//     agent.position.y = 0.5;
//     agent.position.z = 1 * 1.5;
//     // agent.rotation.x = 90;
//     scene.add( agent );
//     console.log('created agent', id)

//     const earthDiv = document.createElement( 'div' );
//     earthDiv.className = 'label';
//     earthDiv.textContent = id;
//     earthDiv.style.marginTop = '-1em';

//     const earthLabel = new CSS2DObject( earthDiv );
//     earthLabel.position.set( 0, 0, 0 );
//     agent.add( earthLabel );
//     earthLabel.layers.set( 0 );

//     return agent;
// }





var socket = io();

socket.on("connect", () => {
    console.log(socket.id); // x8WIv7-mJelg7on_ALbx
});

socket.on("tile", (x, y, delivery) => {
    setTile(x, y, delivery)
});

var me = new Agent('me', 0, 0, 0);

socket.on("you", ({id, x, y, score, carrying}) => {
    console.log("you", {id, x, y, score, carrying})
    
    /**
     * Auto-follow camera
     */
    camera.position.x += ( x - me.x ) * 1.5
    camera.position.z -= ( y - me.y ) * 1.5
    controls.update();
    controls.target.set(x*1.5, 0, -y*1.5);
    
    // Me
    me.x = x
    me.y = y
    me.score = score

    // for ( let c of carrying ){
    //     var {id, x, y, reward} = c;
    //     if ( !me.carrying.has(id) ) {
    //         me.carrying.set( id, parcels.get(id) );
    //     }
    // }
    for ( let p of carrying ) {
        var parcel = parcels.get( p.id );
        parcel.reward = p.reward;
        parcel.pickup(me);
    }

    if ( me.x % 1 == 0 && me.y % 1 == 0 )
        for ( var tile of tiles.values() ) {
            var distance = Math.abs(me.x-tile.x) + Math.abs(me.y-tile.y);
            tile.opacity = ( distance<5 ? 1 : 0.2 );
        }
});

socket.on("sensing agent", (id, x, y, score, carrying) => {
    console.log("sensing agent ", id, x, y, score, carrying.lenght)
    if ( !agents.has(id) )
        agents.set( id, new Agent(id, x, y, score) )
    // var a_mesh = agents.get(id)
    var me = agents.get(id)

    if ( x != null && y != null ) {
        me.opacity = 1;
        me.x = x;
        me.y = y;
        me.score = score;
    }
    else {
        me.opacity = 0;
    }

    // pickup if carrying
    for ( let p of carrying ) {
        var parcel = parcels.get( p.id );
        parcel.reward = p.reward;
        parcel.pickup(me);
    }

    // putdown if not carrying
    const carryingId = Array.from(carrying).map( ({id}) => id )
    for ( let [pid,p] of me.carrying.entries() ) {
        if ( !carryingId.includes(pid) )
            p.putdown();
    }
});


// socket.on("parcel added", (id, x, y, reward) => {
//     if ( !parcels.has(id) )
//         parcels.set( id, new Parcel(id, reward, x, y) )
// });
// socket.on("parcel removed", (id) => {
//     if ( parcels.has(id) )
//         parcels.get(id).removeMesh();
// });
// socket.on("parcel reward", ({id, reward}) => {
//     // console.log("parcel reward", id, reward)
//     if ( parcels.has(id) )
//         parcels.get(id).reward = reward;
//     else
//         console.log("parcel not found", id)
// });

socket.on("parcel sensing", (sensed) => {
    console.log("parcel sensing")//, sensed.length)
    var sensed = Array.from(sensed)
    var sensed_ids = sensed.map( ({id,x,y,reward}) => id )
    for ( const [id, parcel] of parcels.entries() ) {
        if ( !parcel.carriedBy && !sensed_ids.includes( parcel.id ) ) {
            // console.log('no more sensing parcel', knownId)
            parcel.opacity = 0;
            // parcel.removeMesh();
            // parcels.delete(knownId);
        }
    }
    for ( const sense of sensed ) {
        // console.log("parcel sensing", sense)
        let {id, x, y, reward} = sense
        if ( !parcels.has(id) )
            parcels.set( id, new Parcel(id, reward, x, y) )
        var parcel = parcels.get(id);
        if ( !parcel.carriedBy ) {
            parcel.x = x;
            parcel.y = y;
            parcel.opacity = 1;
        }
        parcel.reward = reward;
    }
});

document.onkeydown = function(evt) {
    evt = evt || window.event;
    var charCode = evt.keyCode || evt.which;
    // var charStr = String.fromCharCode(charCode);
    // alert(charStr);
    switch (charCode) {
        case 81:// Q pickup
        console.log('emit pickup');
        socket.emit('pickup', (picked) => {
            console.log( 'pickup', picked, 'parcels' );
            for ( let p of picked ) {
                parcels.get( p.id ).pickup(me);
            }
        } );
        break;
        case 69:// E putdown
        console.log('emit putdown');
        socket.emit('putdown', (dropped) => {
            console.log( 'putdown', dropped, 'parcels' );
            for ( let p of dropped ) {
                parcels.get( p.id ).putdown();
            }
        } );
        break;
        case 87 || 38:// W up
        console.log('emit move up');
        socket.emit('move', 'up', (status) => console.log( (status ? 'move done' : 'move failed') ) );
        break;
        case 65 || 37:// A left
        console.log('emit move left');
        socket.emit('move', 'left', (status) => console.log( (status ? 'move done' : 'move failed') ) );
        break;
        case 83 || 40:// S down 
        console.log('emit move down');
        socket.emit('move', 'down', (status) => console.log( (status ? 'move done' : 'move failed') ) );
        break;
        case 68 || 39:// D right
        console.log('emit move right');
        socket.emit('move', 'right', (status) => console.log( (status ? 'move done' : 'move failed') ) );
        break;
        default:
        break;
    }
};