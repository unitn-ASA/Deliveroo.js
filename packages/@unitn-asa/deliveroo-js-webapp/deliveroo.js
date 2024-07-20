import { default as io } from 'socket.io-client';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { CSS2DRenderer, CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';
import { GUI } from 'three/addons/libs/lil-gui.module.min.js';
import { default as EventEmitter } from 'events';


const scene = new THREE.Scene();

// const camera = new THREE.OrthographicCamera( -100, 100, 10, -10, 1, 100 );
const camera = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 0.1, 300 );
camera.position.set(-1, 2, +2);

const renderer = new THREE.WebGLRenderer();
renderer.setSize( window.innerWidth, window.innerHeight );
document.body.appendChild( renderer.domElement );

const labelRenderer = new CSS2DRenderer();
labelRenderer.setSize( window.innerWidth, window.innerHeight );
labelRenderer.domElement.style.position = 'absolute';
labelRenderer.domElement.style.top = '0px';
document.body.appendChild( labelRenderer.domElement );

window.addEventListener("resize", () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    labelRenderer.setSize( window.innerWidth, window.innerHeight );
} );

const controls = new OrbitControls( camera, labelRenderer.domElement );
controls.minDistance = 10;
controls.maxDistance = 100;
controls.maxAzimuthAngle = Math.PI/10;
controls.minAzimuthAngle = -Math.PI/6;
controls.maxPolarAngle = Math.PI/2.2;
controls.minPolarAngle = 0;
controls.listenToKeyEvents( window );
controls.screenSpacePanning = false;
controls.target.set(0, 0, 0);
controls.update();

var enable_shift_mod = false;
window.addEventListener( 'keydown', (event) => {
    enable_shift_mod = ( event.keyCode === 16 ) ? true : false; // 12 is SHIFT
} );
window.addEventListener( 'keyup', (event) => {
    enable_shift_mod = false;
} );

const mouse = new THREE.Vector2();
const raycaster = new THREE.Raycaster();
const clickables = new Array();
// const drag_controls = new DragControls( clickables, camera, labelRenderer.domElement );
// drag_controls.addEventListener( 'hoveron', (event) => hovered = event.object );
// drag_controls.addEventListener( 'hoveroff', (event) => hovered = null );
// https://github.com/mrdoob/three.js/blob/master/examples/misc_controls_drag.html
labelRenderer.domElement.addEventListener( 'click', ( event ) => {
    mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
    mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;
    raycaster.setFromCamera( mouse, camera );
    const intersections = raycaster.intersectObjects( clickables, true );
    if ( intersections.length > 0 ) {
        let hovered = intersections[ 0 ].object;
        let x = Math.round( hovered.position.x / 1.5 )
        let y = Math.round( - hovered.position.z / 1.5 )
        if ( enable_shift_mod ) {
            console.log( 'shift-click', x, y );
            socket.emit( 'shift-click', x, y );
        } else {
            /* For the plugin update the client emit only the click event, the server then will menage that 
            if ( Array.from(parcels.values()).find( p => p.x == x && p.y == y ) ) {
                console.log( 'dispose parcel', x, y );
                socket.emit( 'dispose parcel', x, y );
            } else {
                console.log( 'create parcel', x, y );
                socket.emit( 'create parcel', x, y );
            }
            */
            console.log( 'click', x, y );
            socket.emit( 'click', x, y );
        }
    }
} );

// for (var x=0; x<10; x++) {
//     for (var y=0; y<10; y++) {
//         addTile(x, y);
//     }
// }

const camTarget = new THREE.Vector3(0,0,0);

const animator = new EventEmitter();
animator.setMaxListeners(1000);

function animate() {
   
    //me.position.lerp( new Vector3().set(me.x-2, 10, -me.y+10), 0.1 );
    animator.emit( 'animate' );

    // Lerp move cameraTarget toward agent and apply camera offset 
    let diff = new THREE.Vector3().copy( camTarget ).sub( camTarget.lerp( me.mesh.position, 0.08 ) );
    camera.position.sub( diff );
    controls.target.sub( diff );

	// required if controls.enableDamping or controls.autoRotate are set to true
	controls.update();

    renderer.render( scene, camera );
    labelRenderer.render( scene, camera );

    requestAnimationFrame( animate );
}



function createPanel() {

    const panel = new GUI( { width: 310 } );
    
    const tokenFolder = panel.addFolder( 'Tokens' );
    tokenFolder.close();

    const chatFolder = panel.addFolder( 'Chat' );
    chatFolder.open();

    function processMsg (id, name, msg) {
        let line = {}; line[id+' '+name] = JSON.stringify(msg)
        chatFolder.add( line, id+' '+name );
    }

    const leaderboardFolder = panel.addFolder( 'Leaderboard' );
    leaderboardFolder.open();
    
    const players = {}
    function updateLeaderboard ( agent ) {
        try {
            if ( ! Object.hasOwnProperty.call( players, agent.name ) ) {
                let player = {}; player[ agent.name ] = agent.score;
                let controller = leaderboardFolder.add( player, agent.name, 0, 1000 );
                players [ agent.name ] = controller;
            }
            players[ agent.name ].setValue( agent.score );
        } catch (error) {
            //console.log(error)
        }
        

    }

    return { updateLeaderboard, processMsg }

}
const { updateLeaderboard, processMsg } = createPanel();

// const geometry = new THREE.ConeGeometry( 0.5, 1, 32 );
// const material = new THREE.MeshBasicMaterial( { color: 0xffff00 } );
// const my_mesh = new THREE.Mesh( geometry, material );
// my_mesh.position.x = 1 * 1.5;
// my_mesh.position.y = 0.5;
// my_mesh.position.z = 1 * 1.5;
// // my_mesh.rotation.x = 90;
// scene.add( my_mesh );



/**
 * Grid axes
 */
{
    const dir = new THREE.Vector3( 1, 0, 0 ).normalize(); //normalize the direction vector (convert to vector of length 1)
    const origin = new THREE.Vector3( -1, 0, 1 );
    const length = 1;
    const hex = 0xffff00;
    const headLength = 0.2; // The length of the head of the arrow. Default is 0.2 * length.
    const headWidth = 0.2; // The width of the head of the arrow. Default is 0.2 * headLength.

    const arrowHelper = new THREE.ArrowHelper( dir, origin, length, hex, headLength, headWidth );
    scene.add( arrowHelper );
}
{
    const dir = new THREE.Vector3( 0, 0, -1 ).normalize(); //normalize the direction vector (convert to vector of length 1)
    const origin = new THREE.Vector3( -1, 0, 1 );
    const length = 1;
    const hex = 0xffff00;
    const headLength = 0.2; // The length of the head of the arrow. Default is 0.2 * length.
    const headWidth = 0.2; // The width of the head of the arrow. Default is 0.2 * headLength.

    const arrowHelper = new THREE.ArrowHelper( dir, origin, length, hex, headLength, headWidth );
    scene.add( arrowHelper );
}



class onGrid {
    
    #mesh
    /** @return {THREE.Mesh} */
    get mesh () {
        return this.#mesh;
    }

    #x
    get x () {
        return this.#x
    }
    set x (x) {
        this.#x = x
        // this.#mesh.position.x = x * 1.5
    }

    #y
    get y () {
        return this.#y
    }
    set y (y) {
        this.#y = y
        // this.#mesh.position.z = -y * 1.5
    }

    #carriedBy
    pickup ( agent ) {
        this.#carriedBy = agent;
        this.#carriedBy.#mesh.add( this.#mesh );
        this.#carriedBy.carrying.set(this.id, this);
        scene.remove( this.#mesh );
        this.x = 0;
        this.y = 0;
        this.#mesh.position.x = 0;
        this.#mesh.position.z = 0;
        this.#mesh.position.y = this.#carriedBy.carrying.size * 0.5;
    }
    putdown ( x, y ) {
        this.#carriedBy.#mesh.remove( this.#mesh );
        this.#carriedBy.carrying.delete(this.id);
        this.opacity = 1;
        this.x = x // this.#agent.x;
        this.y = y // this.#agent.y;
        this.#mesh.position.x = this.#carriedBy.#mesh.position.x;
        this.#mesh.position.z = this.#carriedBy.#mesh.position.z;
        this.#mesh.position.y = 0.5;
        this.#carriedBy = undefined;
        scene.add( this.#mesh );
    }
    get carriedBy () {
        return this.#carriedBy;
    }
    set carriedBy(carriedBy) {
        this.#carriedBy = carriedBy
    }

    set opacity (opacity) {
        this.#mesh.material.opacity = opacity;
        this.#label.element.style.visibility  = ( opacity == 0 ? "hidden" : "visible" );
    }

    set color (color) {
        this.#mesh.material.color.setHex( color );
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

        clickables.push( mesh );

        this.#mesh = mesh
        this.#mesh.position.y = 0.5
        this.x = x
        this.y = y

        this.#mesh.position.set( x * 1.5, 0.5, - y * 1.5 );

        animator.on( 'animate', () => {
            let x = Math.round( this.x );
            let y = Math.round( this.y );
            let targetVector3 = new THREE.Vector3( x * 1.5, this.#mesh.position.y, - y * 1.5 );

                // // Move directly to x and y
                // targetVector3 = new THREE.Vector3( this.x * 1.5, this.#mesh.position.y, - this.y * 1.5 );
                // this.#mesh.position.copy( targetVector3 );

            if ( x == this.x && y == this.y ) { // if arrived
                this.#mesh.position.lerp( targetVector3, 0.5 );
            } else { // if still moving
                // targetVector3 = new THREE.Vector3( this.x * 1.5, this.#mesh.position.y, - this.y * 1.5 );
                this.#mesh.position.lerp( targetVector3, 0.08 );
            }
        } )
        
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
        if (this.#carriedBy) {
            this.#carriedBy.#mesh.remove( this.#mesh );
            this.#carriedBy.carrying.delete(this.id);
        }
        renderer.renderLists.dispose();
    }

}



class PathPoint {

    show () {
        this.sphere.material.opacity = 1;
    }
    hide () {
        this.sphere.material.opacity = 0;
    }
    
    sphere;

    constructor (x, y) {
        const geometry = new THREE.SphereGeometry( 0.1, 5, 5 );
        const material = new THREE.MeshBasicMaterial( { color: 0xffffff, transparent: true, opacity: 0 } );
        this.sphere = new THREE.Mesh( geometry, material );
        this.sphere.position.set( x * 1.5, 0.1, - y * 1.5 );
        scene.add( this.sphere );
    }

}



const tiles = new Map();
window.getMap = function () {
    const map = [];
    for ( let x=0; x<WIDTH; x++ ) {
        const row = []
        for ( let y=0; y<HEIGHT; y++ ) {
            if ( tiles.has(x + y*1000) ) {
                /**@type {Tile}*/
                let tile = tiles.get( x + y*1000 );
                if ( tile.blocked )
                    row.push(0);
                else if ( tile.delivery )
                    row.push(2);
                else if ( tile.spawner )
                    row.push(1);
                else
                    row.push(3);
            }
            else {
                row.push(0);
            }
        }
        map.push(row);
    }
    var string = "[\n";
    string += map.map( row => '\t[' + row.join(', ') + ']' ).join( ',\n' )
    // for (const row of map) {
    //     string += '\t[' + row.join(', ') + '],\n';
    // }
    string += "\n]";
    console.log( string );
    return map;
};

// Function that create the 3D Graphical rappresentation given e style object 
function createGraphic(style) {
    let graphic;

    try {
        let geometry;
        let shape = style.shape
        let params = style.params

        switch (shape) {
            case 'box':
                geometry = new THREE.BoxGeometry(params.width, params.height, params.depth, params.widthSegments, params.heightSegments, params.depthSegments);
                break;
            case 'capsule':
                geometry = new THREE.CapsuleGeometry(params.radius, params.lenght, params.capSegment, params.radialSegment)
                break
            case 'cone':
                geometry = new THREE.ConeGeometry(params.radius, params.height, params.radialSegments, params.heightSegments, params.openEnded, params.thetaStart, params.thetaLength)
                break
            case 'cylinder':
                geometry = new THREE.CylinderGeometry(params.radiusTop, params.radiusBottom, params.height, params.radialSegments, params.heightSegments, params.openEnded, params.thetaStart, params.thetaLength);
                break;
            case 'dodecahedron':
                geometry = new THREE.DodecahedronGeometry(params.radius, params.detail);
                break;
            case 'icosahedron':
                geometry = new THREE.IcosahedronGeometry(params.radius, params.detail);
                break;
            case 'lathe':
                geometry = new THREE.LatheGeometry(params.points, params.segments, params.phiStart, params.phiLength);
                break;
            case 'octahedron':
                geometry = new THREE.OctahedronGeometry(params.radius, params.detail);
                break;
            case 'sphere':
                geometry = new THREE.SphereGeometry(params.radius, params.widthSegments, params.heightSegments, params.phiStart, params.phiLength, params.thetaStart, params.thetaLength);
                break;
            case 'tetrahedron':
                geometry = new THREE.TetrahedronGeometry(params.radius, params.detail);
                break;
            case 'torus':
                geometry = new THREE.TorusGeometry(params.radius, params.tube, params.radialSegments, params.tubularSegments, params.arc);
                break;
            default:
                console.error('Shape not supported:', shape);
                geometry = new THREE.BoxGeometry(0.1, 0.1, 0.1)
        }

        let color = style.color || 0x000000 
        const material = new THREE.MeshBasicMaterial( { color: color, transparent: true, opacity: 1 } );
        graphic = new THREE.Mesh( geometry, material );

    } catch (error) {
        let geometry = new THREE.BoxGeometry(0, 0, 0)
        const material = new THREE.MeshBasicMaterial( { color: 0x000000, transparent: true, opacity: 0 } );
        graphic = new THREE.Mesh( geometry, material );
    }
    

    return graphic
}

class Tile extends onGrid {

    pathPoint;

    #delivery = false;
    get delivery () {
        return this.#delivery;
    }
    set delivery ( value ) {
        this.#delivery = value;
    }

    #spawner = false;
    get spawner () {
        return this.#spawner;
    }
    set spawner ( value ) {
        this.#spawner = value?true:false;
    }
    
    #blocked = false;
    get blocked () {
        return this.#blocked;
    }
    set blocked ( value ) {
        this.#blocked = value;
        
    }
    
    constructor (x, y, type, metadata, delivery=false) {
        
        let graphic = createGraphic(metadata.style);
        scene.add( graphic );

        super(graphic, x, y);
        graphic.position.y = 0;
        this.#delivery = delivery;

        this.pathPoint = new PathPoint(x, y);
    }

}

function setTile(x, y, type, metadata, delivery) {
    if ( !tiles.has(x + y*1000) )
        tiles.set( x + y*1000, new Tile(x, y, type, metadata, delivery) );
    return tiles.get( x + y*1000 );
}

function getTile(x, y, type, metadata) {
    //console.log(x, y, geometry, color)
    if ( !tiles.has(x + y*1000) )
        tiles.set( x + y*1000, new Tile(x, y, type, metadata) );
    return tiles.get( x + y*1000 );
}



class Entity extends onGrid {

    id

    constructor ( id, x, y, type, metadata) {
        let graphic = createGraphic(metadata.style);
        scene.add( graphic );

        if(metadata.label)super(graphic, x, y, 'ciao')
        else  super(graphic, x, y, false)

        this.id = id

        if (metadata.carriedBy) {
            this.carriedBy = metadata.carriedBy
            this.pickup( getOrCreateAgent( metadata.carriedBy ) )
        }

    }

}

var entities = new Map();

function getOrCreateEntity ( id, x=-1, y=-1, type, metadata) {
    var entity = entities.get(id);
    if ( !entity ) {
        entity = new Entity(id, x, y, type, metadata);
        entities.set( id, entity );
    }
    return entity;
}

function deleteEntity ( id ) {
    getOrCreateEntity( id ).removeMesh();
    entities.delete( id );
}



class Agent extends onGrid {

    /** @type {string} Map id to parcel */
    id

    /** @type {Map<string,Parcel>} Map id to parcel */
    carrying = new Map();

    // async animateMove (x, y) {
    //     x = Math.round(x)
    //     y = Math.round(y)
    //     for (let i = 0; i < 10; i++) {
    //         await new Promise( res => setTimeout(res, 200 / 10))
    //         if ( super.x != x )
    //             super.x = Math.round( super.x *10 + ( x > super.x ? +1 : -1 ) ) / 10;
    //         if ( super.y != y )
    //             super.y = Math.round( super.y *10 + ( y > super.y ? +1 : -1 ) ) / 10;
    //     }
    // }

    #name = 'loading'
    get name () {
        return this.#name
    }
    set name (name) {
        this.#name = name
        this.text = this.#name+'\n'+this.#score;
    }

    #score = 0
    get score () {
        return this.#score
    }
    set score (score) {
        this.#score = score
        this.text = this.#name+'\n'+this.#score;
    }

    constructor (id, x, y, type, metadata) {
        let graphic = createGraphic(metadata.style);
        if(graphic) scene.add( graphic );

        super(graphic, x, y, metadata.label)

        this.id = id
        this.score = metadata.score || 0
        this.name = metadata.name || 'undefined'
    }

}



const agents = new Map();



/**
 * 
 * @param {*} id 
 * @param {*} name 
 * @param {*} x 
 * @param {*} y 
 * @param {*} score 
 * @returns {Agent}
 */
function getOrCreateAgent ( id, x=-1, y=-1, type, metadata ) {
    var agent = agents.get(id);
    if ( !agent ) {
        agent = new Agent(id, x, y, type, metadata);
        agents.set( id, agent );
    }
    return agent;
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



function setCookie(cname, cvalue, exdays) {
    const d = new Date();
    d.setTime(d.getTime() + (exdays * 24 * 60 * 60 * 1000));
    let expires = "expires="+d.toUTCString();
    document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
}

function getCookie(cname) {
    let name = cname + "=";
    let ca = document.cookie.split(';');
    for(let i = 0; i < ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) == ' ') {
            c = c.substring(1);
        }
        if (c.indexOf(name) == 0) {
            return c.substring(name.length, c.length);
        }
    }
    return "";
}

function checkCookieForToken ( name ) {
    let token = getCookie( 'token_'+name );
    if ( token == "" || token == null ) {
        token = prompt( `No token exists for user ${name}, please insert a valid token or leave empty to get a new one:`, "");
        if ( token != "" && token != null ) {
            setCookie( 'token_'+name, token, 365 );
        }
    } else {
        token = prompt( `Welcome back, ${name}, the browser has this token for you. You can 1) confirm 2) insert a different token 3) leave empty to get a new one.`, token );
        setCookie( 'token_'+name, token, 365 );
    }
    return token;
}

let params = (new URL(document.location)).searchParams;
let name = params.get("name");
let agentType = params.get("agentType");

// Redirect if no name specified in query
if ( !name ) {
    name = prompt("Enter your name:", "");
    params.set( "name", name )
    document.location.search = params.toString(); //document.location.href
}

// Redirect if no agentType specified in query
if ( !agentType ) {
    agentType = prompt("Enter your agentType:", "");
    params.set( "agentType", agentType )
    document.location.search = params.toString(); //document.location.href
}

// Retrieve existing token, modify it, or get a new one
var token = checkCookieForToken( name )

// Connect
var socket = io( import.meta.env.VITE_SOCKET_IO_HOST || '', {
    extraHeaders: {
        'x-token': token
    },
    query: {
        name: params.get("name"),
        agentType: params.get("agentType"),
    }
} );


var me = {mesh: {position: {x:0, y:0, z:0}} }


socket.on( "connect", () => {
    // console.log( "connect", socket.id, token ); // x8WIv7-mJelg7on_ALbx
    document.getElementById('socket.id').textContent = `socket.id ${socket.id}`
});

socket.on( "disconnect", (reason) => {
    if (reason === "io server disconnect") {
        // the disconnection was initiated by the server, you need to reconnect manually
        alert( `Token is invalid!` );
        socket.connect();
    }
    console.error( `Socket.io connection error` );
});

socket.on("connect_error", (reason) => {
    alert( `Reconnecting, press ok to continue.` );
});

socket.on( "token", (token) => {
    prompt( `Welcome, ${name}, here is your new token. Use it to connect to your new agent.`, token );
    setCookie( 'token_'+name, token, 365 );
    // navigator.clipboard.writeText(token);
});

socket.on( 'log', ( {src, timestamp, socket, id, name}, ...message ) => {
    if ( src == 'server' )
        console.log( 'server', timestamp, '\t', ...message )
    else
        console.log( 'client', timestamp, socket, id, name, '\t', ...message );
} );

socket.on( 'draw', ( {src, timestamp, socket, id, name}, buffer ) => {
    // console.log( 'draw', {src, timestamp, socket, id, name}, buffer )

    // let uint8Array = new Uint8Array(buffer);
    // let binaryString = String.fromCharCode.apply(null, uint8Array);
    // let base64Image = btoa(binaryString);
    // let imgSrc = 'data:image/png;base64,' + base64Image;
    // document.getElementById('canvas').src = imgSrc;

    document.getElementById('canvas').src = buffer;
    
} );

socket.on( 'not_tile', (x, y, type, metadata) => {
    console.log( 'not_tile', x, y, type, metadata )
    getTile(x, y, type, metadata).blocked = true;
});

socket.on( "tile", (x, y, type, metadata, delivery, spawner) => {
    console.log( "tile", x, y, type, metadata )
    getTile(x, y, type, metadata).delivery = delivery;
    getTile(x, y, type, metadata).blocked = false;
    getTile(x, y, type, metadata).spawner = spawner;
});

var WIDTH;
var HEIGHT;
socket.on( "map", (width, height, tiles) => {
    WIDTH = width
    HEIGHT = height
});

socket.on( "msg", ( id, name, msg, reply ) => {
    console.log( 'msg', {id, name, msg, reply} )
    processMsg( id, name, msg )
    if ( msg == 'who are you?' && reply ) reply('I am the web app')
})

socket.on( "path", (path) => {
    for (const tile of tiles.values()) {
        tile.pathPoint.hide();
    }
    for (const {x, y} of path) {
        getTile(x, y).pathPoint.show();
    }
});

var AGENTS_OBSERVATION_DISTANCE = 5;
var PARCELS_OBSERVATION_DISTANCE = 5;
var CONFIG;

socket.on( "config", ( config ) => {
    document.getElementById('config').textContent = JSON.stringify( config, undefined, 2 );
    AGENTS_OBSERVATION_DISTANCE = config.AGENTS_OBSERVATION_DISTANCE;
    PARCELS_OBSERVATION_DISTANCE = config.PARCELS_OBSERVATION_DISTANCE;
    CONFIG = config;
} )

socket.on( "you", ( {id, x, y, type, metadata} ) => {

    console.log( "you", {id, x, y, type, metadata} )
    document.getElementById('agent.id').textContent = `agent.id ${id}`;
    document.getElementById('agent.name').textContent = `agent.name ${name}`;
    document.getElementById('agent.xy').textContent = `agent.xy ${x},${y}`;
    
    // if ( params.get( "id" ) != id ) {
    //     params.set( "id", id )
    //     document.location.search = params.toString();
    // }
    // if ( params.get( "name" ) && params.get( "name" ) != name ) {
    //     params.set( "name", name )
    //     document.location.search = params.toString();
    // }

    me = getOrCreateAgent(id, x, y, type, metadata);

    /**
     * Auto-follow camera
     */
    // camera.position.x += ( x - me.x ) * 1.5;
    // camera.position.z -= ( y - me.y ) * 1.5;
    // controls.target.set(x*1.5, 0, -y*1.5);
    // controls.update();
    
    // Me
    me.x = x
    me.y = y
    me.score = metadata.score

    // when arrived
    if ( x % 1 == 0 && y % 1 == 0 ) {
        for ( var tile of tiles.values() ) {
            var distance = Math.abs(x-tile.x) + Math.abs(y-tile.y);
            let opacity = 0.1;
            if ( !( distance >= PARCELS_OBSERVATION_DISTANCE ) ) opacity += 0.2;
            if ( !( distance >= AGENTS_OBSERVATION_DISTANCE ) ) opacity += 0.2;
            tile.opacity = ( opacity > 0.4 ? 1 : opacity );
        }
    } else { // when moving
        // me.animateMove(x, y)
    }

    updateLeaderboard( me );

});



socket.on("agents sensing", (sensed) => {

    console.log("agents sensing", ...sensed)//, sensed.length)

    var sensed = Array.from(sensed)
    
    var sensed_ids = sensed.map( ({id}) => id )
    for ( const [id, agent] of agents.entries() ) {
        if ( agent!=me && !sensed_ids.includes( agent.id ) ) {
            agent.opacity = 0;
        }
    }

    for ( const sensed_p of sensed ) {
        const {id, x, y, type, metadata} = sensed_p;
        var agent = getOrCreateAgent(id, x, y, type, metadata)

        agent.opacity = 1;
        agent.x = x;
        agent.y = y;
        if ( agent.score != metadata.score ) {
            agent.score = metadata.score;
            updateLeaderboard( agent );
        }
    }

});

socket.on("entities sensing", (sensed) => {

    // console.log("parcels sensing", ...sensed)//, sensed.length)

    var sensed = Array.from(sensed)

    var sensed_ids = sensed.map( ({id}) => id )
    for ( const [id, was] of entities.entries() ) {
        if ( !sensed_ids.includes( was.id ) ) {
            // console.log('no more sensing parcel', knownId)
            // was.opacity = 0;
            deleteEntity( was.id ); // parcel.removeMesh(); // parcels.delete(knownId);
        }
    }

    for ( const {id, x, y, type, metadata} of sensed ) {
        
        const was = getOrCreateEntity(id, x, y, type, metadata);

        if ( metadata.carriedBy ) {
            if ( !was.carriedBy ) {
                var agent = getOrCreateAgent( metadata.carriedBy );
                was.pickup( agent );
            }
        }
        else {
            if ( was.carriedBy )
                was.putdown(x, y);
            else {
                was.x = x;
                was.y = y;
            }
        }
        was.text = metadata.label;
    }

});

var action = null;
async function start_doing ( ) {
    while ( action ) {
        let res = await action();
        // if failed stop doing until keyup reset the action
        if ( ! res )
            break;
    }
}

document.onkeyup = function(evt) {
    action = null;
}

// Update the key comands for support all the new actions of the agent
document.onkeydown = function(evt) {
    if (action == null) {
        // do the rest of this function and then call start_doing
        setTimeout(start_doing);
    }

    let key = evt.code;
    let isShift = evt.shiftKey;
    
    if (isShift) {
        key = 'Shift' + key; // Concatenate 'Shift' with the key code
    }

    switch (key) {
        case 'KeyQ': // Q pickup
            // console.log('KeyQ')
            action = () => {
                return new Promise((res) => {
                    socket.emit('pickup', (status) => {
                        res(status);
                    });
                });
            };
            break;
        case 'KeyE': // E putdown
            // console.log('KeyE')
            action = () => {
                return new Promise((res) => {
                    socket.emit('putdown', (status) => {
                        res(status);
                    });
                });
            };
            break;
        case 'KeyW': // W up
            // console.log('KeyW')
            action = () => {
                return new Promise((res, rej) => {
                    socket.emit('up', (status) => {
                        res(status);
                    });
                });
            };
            break;
        case 'KeyA': // A left
            // console.log('KeyA')
            action = () => {
                return new Promise((res, rej) => {
                    socket.emit('left', (status) => {
                        res(status);
                    });
                });
            };
            break;
        case 'KeyS': // S down
            // console.log('KeyS')
            action = () => {
                return new Promise((res, rej) => {
                    socket.emit('down', (status) => {
                        res(status);
                    });
                });
            };
            break;
        case 'KeyD': // D right
            // console.log('KeyD')
            action = () => {
                return new Promise((res, rej) => {
                    socket.emit('right', (status) => {
                        res(status);
                    });
                });
            };
            break;
        case 'Space': // Space jump
            // console.log('Space')
            action = () => {
                return new Promise((res) => {
                    socket.emit('jump', (status) => {
                        res(status);
                    });
                });
            };
            break;
        case 'ShiftKeyW': // Shift+W shiftUp
            // console.log('ShiftKeyW')
            action = () => {
                return new Promise((res) => {
                    socket.emit('shift-up', (status) => {
                        res(status);
                    });
                });
            };
            break;
        case 'ShiftKeyA': // Shift+A shiftLeft
            // console.log('ShiftKeyA') 
            action = () => {
                return new Promise((res) => {
                    socket.emit('shift-left', (status) => {
                        res(status);
                    });
                });
            };
            break;
        case 'ShiftKeyS': // Shift+S shiftDown
            // console.log('ShiftKeyS')
            action = () => {
                return new Promise((res) => {
                    socket.emit('shift-down', (status) => {
                        res(status);
                    });
                });
            };
            break;
        case 'ShiftKeyD': // Shift+D shiftRight
            // console.log('ShiftKeyD')
            action = () => {
                return new Promise((res) => {
                    socket.emit('shift-right', (status) => {
                        res(status);
                    });
                });
            };
            break;
        case 'ShiftSpace': // Shift+R shiftJump
            // console.log('ShiftSpace')
            action = () => {
                return new Promise((res) => {
                    socket.emit('shift-jump', (status) => {
                        res(status);
                    });
                });
            };
            break;
        case 'ShiftKeyQ': // Shift+Q shiftPickup
            // console.log('ShiftKeyQ')
            action = () => {
                return new Promise((res) => {
                    socket.emit('shift-pickup', (picked) => {
                        res(status);
                    });
                });
            };
            break;
        case 'ShiftKeyE': // Shift+E shiftPutdown
            // console.log('ShiftKeyE')
            action = () => {
                return new Promise((res) => {
                    socket.emit('shift-putdown', null, (dropped) => {
                        res(status);
                    });
                });
            };
            break;
        default:
            break;
    }
};





animate();