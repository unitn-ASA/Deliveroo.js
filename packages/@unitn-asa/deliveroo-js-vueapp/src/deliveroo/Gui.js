import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { CSS2DRenderer, CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';
import { default as EventEmitter } from 'events';
import { Game } from './Game.js';


var enable_tile_mod = false;
window.addEventListener( 'keydown', (event) => {
    enable_tile_mod = ( event.keyCode === 16 ) ? true : false; // 12 is SHIFT
} );
window.addEventListener( 'keyup', (event) => {
    enable_tile_mod = false;
} );



class Gui {

    /**
     * @type {Game}
     */
    game;

    /**
     * @type {THREE.Scene}
     */
    scene;

    /**
     * @type {THREE.PerspectiveCamera}
     */
    camera;

    /**
     * @type {THREE.WebGLRenderer}
     */
    renderer;

    /**
     * @type {CSS2DRenderer}
     */
    labelRenderer;

    /**
     * @type {OrbitControls}
     */
    controls;

    /**
     * @type {Array} Clickables meshes
     */
    clickables;



    /**
     * @param {Game} game
     */
    constructor ( game ) {

        this.game = game;

        // Html to append element
        // const container = document.body;
        const htmlcontainer = document.getElementById('threejs');

        // Create scene
        this.scene = new THREE.Scene();

        // Create camera
        // const camera = new THREE.OrthographicCamera( -100, 100, 10, -10, 1, 100 );
        this.camera = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 0.1, 300 );
        this.camera.position.set(-1, 2, +2);

        // Create renderer
        this.renderer = new THREE.WebGLRenderer();
        this.renderer.setSize( window.innerWidth, window.innerHeight );
        htmlcontainer.appendChild( this.renderer.domElement );

        // Create label renderer
        this.labelRenderer = new CSS2DRenderer();
        this.labelRenderer.setSize( window.innerWidth, window.innerHeight );
        this.labelRenderer.domElement.style.position = 'absolute';
        this.labelRenderer.domElement.style.top = '0px';
        htmlcontainer.appendChild( this.labelRenderer.domElement );

        // on resize update camera and renderers
        window.addEventListener("resize", () => {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
            this.labelRenderer.setSize( window.innerWidth, window.innerHeight );
        } );

        // Create controls
        this.controls = new OrbitControls( this.camera, this.labelRenderer.domElement );
        this.controls.minDistance = 10;
        this.controls.maxDistance = 100;
        this.controls.maxAzimuthAngle = Math.PI/10;
        this.controls.minAzimuthAngle = -Math.PI/6;
        this.controls.maxPolarAngle = Math.PI/2.2;
        this.controls.minPolarAngle = 0;
        this.controls.listenToKeyEvents( window );
        this.controls.screenSpacePanning = false;
        this.controls.target.set(0, 0, 0);
        this.controls.update();

        // Create x axis arrow
        {
            const dir = new THREE.Vector3( 1, 0, 0 ).normalize(); //normalize the direction vector (convert to vector of length 1)
            const origin = new THREE.Vector3( -1, 0, 1 );
            const length = 1;
            const hex = 0xffff00;
            const headLength = 0.2; // The length of the head of the arrow. Default is 0.2 * length.
            const headWidth = 0.2; // The width of the head of the arrow. Default is 0.2 * headLength.

            const arrowHelper = new THREE.ArrowHelper( dir, origin, length, hex, headLength, headWidth );
            this.scene.add( arrowHelper );
        }
        // Create y axis arrow
        {
            const dir = new THREE.Vector3( 0, 0, -1 ).normalize(); //normalize the direction vector (convert to vector of length 1)
            const origin = new THREE.Vector3( -1, 0, 1 );
            const length = 1;
            const hex = 0xffff00;
            const headLength = 0.2; // The length of the head of the arrow. Default is 0.2 * length.
            const headWidth = 0.2; // The width of the head of the arrow. Default is 0.2 * headLength.

            const arrowHelper = new THREE.ArrowHelper( dir, origin, length, hex, headLength, headWidth );
            this.scene.add( arrowHelper );
        }



        const mouse = new THREE.Vector2();
        const raycaster = new THREE.Raycaster();
        this.clickables = new Array();
        // const drag_controls = new DragControls( clickables, camera, labelRenderer.domElement );
        // drag_controls.addEventListener( 'hoveron', (event) => hovered = event.object );
        // drag_controls.addEventListener( 'hoveroff', (event) => hovered = null );
        // https://github.com/mrdoob/three.js/blob/master/examples/misc_controls_drag.html
        this.labelRenderer.domElement.addEventListener( 'click', ( event ) => {
            mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
            mouse.y = - ( event.pageY / window.innerHeight ) * 2 + 1;
            // console.log( 'click', event, event.clientX, event.clientY, mouse );
            raycaster.setFromCamera( mouse, this.camera );
            const intersections = raycaster.intersectObjects( this.clickables, true );
            if ( intersections.length > 0 ) {
                let hovered = intersections[ 0 ].object;
                let x = Math.round( hovered.position.x / 1.5 );
                let y = Math.round( - hovered.position.z / 1.5 );
                if ( enable_tile_mod ) {
                    console.log( 'tile', x, y );
                    this.game.client.socket.emit( 'tile', x, y );
                } else {
                    if ( Array.from( this.game.parcels.values()).find( p => p.x == x && p.y == y ) ) {
                        console.log( 'dispose parcel', x, y );
                        this.game.client.socket.emit( 'dispose parcel', x, y );
                    } else {
                        console.log( 'create parcel', x, y );
                        this.game.client.socket.emit( 'create parcel', x, y );
                    }
                }
            }
        } );



        // Create animator
        this.animator = new EventEmitter();
        this.animator.setMaxListeners(1000);

        this.animate();

    }



    /**
     * @type {THREE.Mesh}
     */
    targetMesh;
    setTarget ( mesh ) {
        this.targetMesh = mesh;
    }

    /**
     * @type {EventEmitter}
     */
    animator;

    /**
     * @type {THREE.Vector3}
     */
    #camTarget = new THREE.Vector3(0,0,0);

    animate () {
            
        //me.position.lerp( new Vector3().set(me.x-2, 10, -me.y+10), 0.1 );
        this.animator.emit( 'animate' );

        if ( this.targetMesh ) {
            // Lerp move cameraTarget toward agent and apply camera offset
            let diff = new THREE.Vector3().copy( this.#camTarget ).sub( this.#camTarget.lerp( this.targetMesh.position, 0.08 ) );
            this.camera.position.sub( diff );
            this.controls.target.sub( diff );
        }

        // required if controls.enableDamping or controls.autoRotate are set to true
        this.controls.update();

        this.renderer.render( this.scene, this.camera );
        this.labelRenderer.render( this.scene, this.camera );

        requestAnimationFrame( this.animate.bind(this) );
    }

}


export { Gui };