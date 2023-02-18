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

    #carriedBy
    pickup ( agent ) {
        this.#carriedBy = agent;
        this.#carriedBy.#mesh.add( this.#mesh );
        this.#carriedBy.carrying.set(this.id, this);
        scene.remove( this.#mesh );
        this.x = 0
        this.y = 0
        this.#mesh.position.y = this.#carriedBy.carrying.size * 0.5;
    }
    putdown ( x, y ) {
        this.#carriedBy.#mesh.remove( this.#mesh );
        this.#carriedBy.carrying.delete(this.id);
        this.opacity = 1;
        this.x = x // this.#agent.x;
        this.y = y // this.#agent.y;
        this.#mesh.position.y = 0.5;
        this.#carriedBy = undefined;
        scene.add( this.#mesh );
    }
    get carriedBy () {
        return this.#carriedBy;
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
        if (this.#carriedBy) {
            this.#carriedBy.#mesh.remove( this.#mesh );
            this.#carriedBy.carrying.delete(this.id);
        }
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

    constructor ( id, x, y, carriedBy, reward ) {
        const geometry = new THREE.BoxGeometry( 0.5, 0.5, 0.5 );
        var color = new THREE.Color( 0xffffff );
        color.setHex( Math.random() * 0xffffff );
        const material = new THREE.MeshBasicMaterial( { color, transparent: true, opacity: 1 } );
        const parcel = new THREE.Mesh( geometry, material );
        scene.add( parcel );

        super(parcel, x, y, reward)

        this.id = id
        this.#reward = reward

        if (carriedBy) {
            this.pickup( getOrCreateAgent( carriedBy ) )
        }

        // console.log('created parcel', id)
    }

}

var parcels = new Map();

function getOrCreateParcel ( id, x=-1, y=-1, carriedBy=null, reward=-1 ) {
    var parcel = parcels.get(id);
    if ( !parcel ) {
        parcel = new Parcel(id, x, y, carriedBy, reward);
        parcels.set( id, parcel );
    }
    return parcel;
}

function deleteParcel ( id ) {
    getOrCreateParcel( id ).removeMesh();
    parcels.delete( id );
}



class Agent extends onGrid {

    id
    name
    carrying = new Map();

    // #targetX
    // get x () { return super.x }
    // set x ( x ) {
    //     // if ( super.x == NaN )
    //     //     super.x = 0;
    //     super.x = x;
    //     this.#targetX = Math.round(x);
    // }
    // #targetY
    // get y () { return super.y }
    // set y ( y ) {
    //     // if ( super.y == NaN )
    //     //     super.y = 1;
    //     super.y = y;
    //     this.#targetY = Math.round(y);
    // }
    // async movement ( ) {
    //     while ( true ) {
    //         await new Promise( res => setTimeout(res, 5000 / 10))
    //         console.log( this.id, this.#targetX, this.#targetY, super.x, super.y )
    //         if ( super.x != this.#targetX )
    //             super.x = Math.round( super.x *10 + ( this.#targetX > super.x ? +1 : -1 ) ) / 10;
    //         if ( super.y != this.#targetY )
    //             super.y = Math.round( super.y *10 + ( this.#targetY > super.y ? +1 : -1 ) ) / 10;
    //     }
    // }

    #score
    get score () {
        return this.#score
    }
    set score (score) {
        this.#score = score
        this.text = this.name+'\n'+score;
    }

    constructor (id, x, y, score) {
        const geometry = new THREE.ConeGeometry( 0.5, 1, 32 );
        var color = new THREE.Color( 0xffffff );
        color.setHex( Math.random() * 0xffffff );
        const material = new THREE.MeshBasicMaterial( { color, transparent: true, opacity: 1 } );
        const mesh = new THREE.Mesh( geometry, material );
        scene.add( mesh );

        super(mesh, x, y, id+'\n'+score)

        this.id = id
        this.name = id
        this.#score = score

        // this.movement();
    }

}



var agents = new Map();

function getOrCreateAgent ( id, x=-1, y=-1, score=-1 ) {
    var agent = agents.get(id);
    if ( !agent ) {
        agent = new Agent(id, x, y, score);
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
    if ( token == "" ) {
        token = prompt( `No token exists for user ${name}, please insert a valid token or leave empty to get a new one:`, "");
        if (token != "" && token != null) {
            setCookie( 'token_'+name, token, 365 );
        }
    } else {
        token = prompt( `Welcome back, ${name}, the browser has this token for you. You can 1. confirm 2. insert a different token .3 leave empty to get a new one.`, token );
        setCookie( 'token_'+name, token, 365 );
    }
    return token;
}

let params = (new URL(document.location)).searchParams;
let name = params.get("name");

// Redirect if no name specified in query
if ( !name ) {
    name = prompt("Enter your name:", "");
    params.set( "name", name )
    document.location.search = params.toString(); //document.location.href
}

// Retrieve existing token, modify it, or get a new one
var token = checkCookieForToken( name )

// Connect
var socket = io( {
    extraHeaders: {
        'x-token': token
    },
    query: {
        name: params.get("name"),
    }
} );

var me = getOrCreateAgent(name, 0, 0, 0);

socket.on( "connect", () => {
    console.log( "connect socket", socket.id, token ); // x8WIv7-mJelg7on_ALbx
});

socket.on( "disconnect", () => {
    alert( `Disconnected! Connection problems or invalid token.` );
});

socket.on( "token", (token) => {
    prompt( `Welcome, ${name}, here is your new token. Use it to connect to your new agent.`, token );
    setCookie( 'token_'+name, token, 365 );
    // navigator.clipboard.writeText(token);
});

socket.on( "tile", (x, y, delivery) => {
    setTile(x, y, delivery)
});

socket.on( "you", ({id, name, x, y, score} ) => {
    console.log( "you", {id, name, x, y, score} )
    
    // if ( params.get( "id" ) != id ) {
    //     params.set( "id", id )
    //     document.location.search = params.toString();
    // }
    // if ( params.get( "name" ) && params.get( "name" ) != name ) {
    //     params.set( "name", name )
    //     document.location.search = params.toString();
    // }

    me = getOrCreateAgent(id, x, y, score);
    me.name = name;

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

    if ( me.x % 1 == 0 && me.y % 1 == 0 )
        for ( var tile of tiles.values() ) {
            var distance = Math.abs(me.x-tile.x) + Math.abs(me.y-tile.y);
            tile.opacity = ( distance<5 ? 1 : 0.2 );
        }
});



socket.on("agents sensing", (sensed) => {

    console.log("agents sensing", ...sensed)//, sensed.length)

    var sensed = Array.from(sensed)
    
    var sensed_ids = sensed.map( ({id}) => id )
    for ( const [id, agent] of agents.entries() ) {
        if ( agent!=me && !sensed_ids.includes( agent.id ) ) {
            // console.log('no more sensing parcel', knownId)
            agent.opacity = 0;
            // parcel.removeMesh();
            // parcels.delete(knownId);
        }
    }

    for ( const sensed_p of sensed ) {
        // console.log("parcel sensing", sense)
        const {id, name, x, y, score} = sensed_p;
        var agent = getOrCreateAgent(id, x, y, score)
        agent.name = name;
        agent.opacity = 1;
        agent.x = x;
        agent.y = y;
        agent.score = score;
    }

});

socket.on("parcels sensing", (sensed) => {

    console.log("parcels sensing", ...sensed)//, sensed.length)

    var sensed = Array.from(sensed)

    var sensed_ids = sensed.map( ({id}) => id )
    for ( const [id, was] of parcels.entries() ) {
        if ( !sensed_ids.includes( was.id ) ) {
            // console.log('no more sensing parcel', knownId)
            // was.opacity = 0;
            deleteParcel( was.id ); // parcel.removeMesh(); // parcels.delete(knownId);
        }
    }

    for ( const {id, x, y, carriedBy, reward} of sensed ) {
        
        const was = getOrCreateParcel(id, x, y, carriedBy, reward);

        if ( carriedBy ) {
            if ( !was.carriedBy ) {
                var agent = getOrCreateAgent( carriedBy );
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
        was.reward = reward;
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
            // for ( let p of picked ) {
            //     parcels.get( p.id ).pickup(me);
            // }
        } );
        break;
        case 69:// E putdown
        console.log('emit putdown');
        socket.emit('putdown', (dropped) => {
            console.log( 'putdown', dropped, 'parcels' );
            // for ( let p of dropped ) {
            //     parcels.get( p.id ).putdown();
            // }
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