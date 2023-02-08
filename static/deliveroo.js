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

for (var x=0; x<10; x++) {
    for (var y=0; y<10; y++) {
    const geometry = new THREE.BoxGeometry( 1, 0.1, 1 );
    const material = new THREE.MeshBasicMaterial( { color: 0x00ff00 } );
    const cube = new THREE.Mesh( geometry, material );
    cube.position.x = x*1.5;
    cube.position.z = -y*1.5;
    scene.add( cube );
    }
}


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


const geometry = new THREE.ConeGeometry( 0.5, 1, 32 );
const material = new THREE.MeshBasicMaterial( { color: 0xffff00 } );
const my_mesh = new THREE.Mesh( geometry, material );
my_mesh.position.x = 1 * 1.5;
my_mesh.position.y = 0.5;
my_mesh.position.z = 1 * 1.5;
// my_mesh.rotation.x = 90;
scene.add( my_mesh );





var agents = new Map();

function createAgent (id) {
    const geometry = new THREE.ConeGeometry( 0.5, 1, 32 );
    var color = new THREE.Color( 0xffffff );
    color.setHex( Math.random() * 0xffffff );
    const material = new THREE.MeshBasicMaterial( { color, transparent: true, opacity: 0.1 } );
    const agent = new THREE.Mesh( geometry, material );
    agent.position.x = 1 * 1.5;
    agent.position.y = 0.5;
    agent.position.z = 1 * 1.5;
    // agent.rotation.x = 90;
    scene.add( agent );
    console.log('created agent', id)

    const earthDiv = document.createElement( 'div' );
    earthDiv.className = 'label';
    earthDiv.textContent = agent.id;
    earthDiv.style.marginTop = '-1em';

    const earthLabel = new CSS2DObject( earthDiv );
    earthLabel.position.set( 0, 0, 0 );
    agent.add( earthLabel );
    earthLabel.layers.set( 0 );

    return agent;
}

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

    constructor (mesh, x, y, text) {

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
        mesh.add( label );
        label.layers.set( 0 );
    }

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
        const material = new THREE.MeshBasicMaterial( { color, transparent: false, opacity: 1 } );
        const parcel = new THREE.Mesh( geometry, material );
        scene.add( parcel );

        super(parcel, x, y, reward)
        parcels.set(id, this);

        this.id = id
        this.#reward = reward

        console.log('created parcel', id)
    }

}



var socket = io();

socket.on("connect", () => {
    console.log(socket.id); // x8WIv7-mJelg7on_ALbx
});

socket.on("sensing agent", (a) => {
    // console.log("sensing agent ", a)
    if ( !agents.has(a.id) )
        agents.set( a.id, createAgent(a.id) )
    var a_mesh = agents.get(a.id)

    // if ( Math.abs(a.x-my_mesh.position.x) + Math.abs(a.y-my_mesh.position.y) < 2.5 ) {
    a_mesh.material.opacity = 1;
    a_mesh.position.x = a.x * 1.5;
    a_mesh.position.z = -a.y * 1.5;

});

socket.on("no more sensing agent", (a) => {
    var a_mesh = agents.get(a.id)
    if (a_mesh)
        a_mesh.material.opacity = 0.4;
});

socket.on("yourposition", (pos) => {
    // console.log("yourposition", pos)
    var diffX = pos.x * 1.5 - my_mesh.position.x;
    var diffZ = -pos.y * 1.5 - my_mesh.position.z
    my_mesh.position.x = pos.x * 1.5;
    my_mesh.position.z = -pos.y * 1.5;
    // camera.position.set(pos.x * 1.5 - 2, 10, -pos.y * 1.5 + 10);
    camera.position.x += diffX
    camera.position.z += diffZ
    controls.update();
    controls.target.set(my_mesh.position.x, 0, my_mesh.position.z);
});


socket.on("add parcel", ({id, reward, x, y}) => {
    // console.log("sensing agent ", a)
    if ( !parcels.has(id) )
        parcels.set( id, new Parcel(id, reward, x, y) )
});
socket.on("parcel reward", ({id, reward}) => {
    console.log("parcel reward", id, reward)
    if ( parcels.has(id) )
        parcels.get(id).reward = reward;
    else
        console.log("parcel not found", id)
});

document.onkeydown = function(evt) {
    evt = evt || window.event;
    var charCode = evt.keyCode || evt.which;
    // var charStr = String.fromCharCode(charCode);
    // alert(charStr);
    switch (charCode) {
        case 87 || 38:// up
        console.log('emit move up');
        socket.emit('move', 'up', (status) => console.log( (status ? 'move done' : 'move failed') ) );
        break;
        case 65 || 37:// left
        console.log('emit move left');
        socket.emit('move', 'left', (status) => console.log( (status ? 'move done' : 'move failed') ) );
        break;
        case 83 || 40:// down 
        console.log('emit move down');
        socket.emit('move', 'down', (status) => console.log( (status ? 'move done' : 'move failed') ) );
        break;
        case 68 || 39:// right
        console.log('emit move right');
        socket.emit('move', 'right', (status) => console.log( (status ? 'move done' : 'move failed') ) );
        break;
        default:
        break;
    }
};