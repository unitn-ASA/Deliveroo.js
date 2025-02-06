

  
<script setup>
	import { ref, onMounted, onUnmounted, provide, computed, inject, watch } from 'vue';
	import * as THREE from 'three';
	import { CSS2DRenderer } from 'three/examples/jsm/renderers/CSS2DRenderer.js';
	import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
	import { Controller } from '../../utils/Controller.js'
	import { connection } from '@/states/myConnection.js';

    /**
     * @typedef Tile
     * @type {import("@/Grid").Tile}
     */

    /** @typedef Agent
     *  @type {import("@/Grid").Agent}
     */

	const threeContainer = ref(null);
	let scene, camera, renderer, labelRenderer;

	scene = new THREE.Scene();
	camera = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 0.1, 300 );
	renderer = new THREE.WebGLRenderer();
	// renderer.setClearColor('black');
	// // Create a WebGLRenderer and turn on shadows in the renderer
	// renderer.shadowMap.enabled = true;
	// renderer.shadowMap.type = THREE.PCFSoftShadowMap; // default THREE.PCFShadowMap
	
	// Fornisci la scena e la camera ai componenti figli
	provide('scene', scene);
	provide('camera', camera);

	// const props = defineProps( ['targetMesh'] );
    /** @type {import('vue').Ref<THREE.Mesh>} */
    const targetMesh = defineModel()

	/** @type {THREE.Vector3} */
	const camTarget = new THREE.Vector3(0,0,0);

	/** @type {THREE.PointLight} */
	const light = new THREE.PointLight( 0xffffff, 10, 1.5 * 1.2 * 5, 1.5 * 0.2 * 5 );
	light.position.set( 0, 5, 0 );
	// light.castShadow = true;

	watch( () => connection.configs.AGENTS_OBSERVATION_DISTANCE, (newVal) => {
		// console.log( 'ThreeScene.js watch AGENTS_OBSERVATION_DISTANCE', newVal );
		const distance = Math.min( connection.configs.AGENTS_OBSERVATION_DISTANCE, connection.configs.PARCELS_OBSERVATION_DISTANCE );
		light.distance = 1.5 * 1.2 * distance;
		light.decay = 1.5 * 0.2 * distance;
	});

	watch( () => targetMesh.value, (newVal) => {
		// console.log( 'ThreeScene.js watch targetMesh', newVal.position, targetMesh.value.position );
		targetMesh.value.add( light );
	});


	/**
	 * @type {import("vue").ComputedRef<Map<import("three").Mesh,Agent>>}
	 */
	const agentsByMesh = computed ( () => {
		const map = new Map();
		for ( let agent of connection.grid.agents.values() )
			map.set( agent.mesh, agent );
		return map;
	})
	const tilesByMesh = computed ( () => {
		const map = new Map();
		for ( let tile of connection.grid.tiles.values() )
			map.set( tile.mesh, tile );
		return map;
	})
	const parcelsByMesh = computed ( () => {
		const map = new Map();
		for ( let parcel of connection.grid.parcels.values() )
			map.set( parcel.mesh, parcel );
		return map;
	})
	const hoverable = computed ( () => {
		const objects = new Array();
		for ( const { mesh } of connection.grid.agents.values() )
			objects.push( mesh );
		for ( const { mesh } of connection.grid.tiles.values() )
			objects.push( mesh );
		for ( const { mesh } of connection.grid.parcels.values() )
			objects.push( mesh );
		return objects;
	});
	const hovered = ref( {x:null, y:null, obj:null} );
	const clicked = ref( {x:null, y:null, obj:null} );

	onMounted(() => {

		// Initialize Three.js scene 
		renderer.setSize(window.innerWidth, window.innerHeight);
		threeContainer.value.appendChild(renderer.domElement);

		// Initialize CSS2DRenderer
		labelRenderer = new CSS2DRenderer();
		labelRenderer.setSize(window.innerWidth, window.innerHeight);
		labelRenderer.domElement.style.position = 'absolute';
		labelRenderer.domElement.style.top = '0px';
		threeContainer.value.appendChild(labelRenderer.domElement);
	
		// Initialize Camera
		camera.position.set(-6, 16, 20);
	
        // Create controls
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

        // Create x axis arrow
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
        // Create y axis arrow
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


        const mouse = new THREE.Vector2();
        const raycaster = new THREE.Raycaster();
        // const drag_controls = new DragControls( clickables, camera, labelRenderer.domElement );
        // drag_controls.addEventListener( 'hoveron', (event) => hovered = event.object );
        // drag_controls.addEventListener( 'hoveroff', (event) => hovered = null );
        // https://github.com/mrdoob/three.js/blob/master/examples/misc_controls_drag.html
		labelRenderer.domElement.addEventListener( 'mousemove', ( event ) => {
			mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
			mouse.y = - ( event.pageY / window.innerHeight ) * 2 + 1;
			// console.log( 'mousemove', event, event.clientX, event.clientY, mouse );
			raycaster.setFromCamera( mouse, camera );
			const intersections = raycaster.intersectObjects( hoverable.value, true );
			// if something different already hovered, then restore it
			if ( hovered.value.obj && hovered.value.obj != intersections[ 0 ]?.object ) {
				hovered.value.obj.material.opacity = 1;
				hovered.value.obj.scale.set( 1, 1, 1 );
				hovered.value.obj = null;
			}
			// if different than previously hovered
			if ( intersections.length > 0 && hovered.value.obj != intersections[ 0 ]?.object ) {
				let obj = hovered.value.obj = intersections[ 0 ].object;
				let x = hovered.value.x = Math.round( obj.position.x / 1.5 );
				let y = hovered.value.y = Math.round( - obj.position.z / 1.5 );
				if (obj instanceof THREE.Mesh) {
					obj.material.opacity = 0.9;
				}
				obj.scale.set( 1.5, 1.5, 1.5 );
				// console.log( "hovered on", x, y, clicked.value );
			}
		} );
		labelRenderer.domElement.addEventListener( 'click', ( event ) => {
			if ( hovered.value.obj ) {
				let obj = clicked.value.obj = hovered.value.obj;
				let x = clicked.value.x = Math.round( obj.position.x / 1.5 );
				let y = clicked.value.y = Math.round( - obj.position.z / 1.5 );
				// console.log( "clicked on", x, y, clicked.value );
				
				if ( tilesByMesh.value.has( obj ) ) {
					let tile = tilesByMesh.value.get( obj );
					connection.grid.selectedTile.value = tile;
				}

				if ( agentsByMesh.value.has( obj ) ) {
					let agent = agentsByMesh.value.get( obj );
					connection.grid.selectedAgent.value = agent;
				}

				if ( parcelsByMesh.value.has( obj ) ) {
					let parcel = parcelsByMesh.value.get( obj );
					connection.grid.selectedParcel.value = parcel;
				}

            }
        } );



		// Funzione di animazione
		const animate = () => {
			
			if ( targetMesh.value ) {
				// current cam target
				let current = new THREE.Vector3().copy( camTarget );
				// lerp cam target toward mesh
				camTarget.lerp( targetMesh.value.position, 0.04 );
				// compute and apply camera offset
				let diff = current.sub( camTarget );
				camera.position.sub( diff );
				controls.target.sub( diff );

				// controls.target.lerp( targetMesh.value.position, 0.02 );
				
			}
			// required if controls.enableDamping or controls.autoRotate are set to true
			controls.update();

			renderer.render(scene, camera);
			labelRenderer.render(scene, camera);

			requestAnimationFrame( animate );
		};

		requestAnimationFrame( animate );

		// Gestisci il ridimensionamento della finestra
		window.addEventListener('resize', onWindowResize);

		new Controller( connection );
	});

	onUnmounted(() => {
		// Pulisci la scena di Three.js
		window.removeEventListener('resize', onWindowResize);
		// threeContainer.value.removeChild(renderer.domElement);
		// threeContainer.value.removeChild(labelRenderer.domElement);
	});

	const onWindowResize = () => {
		camera.aspect = window.innerWidth / window.innerHeight;
		camera.updateProjectionMatrix();
		renderer.setSize(window.innerWidth, window.innerHeight);
		labelRenderer.setSize(window.innerWidth, window.innerHeight);
	};
</script>

<template>
    <div ref="threeContainer" class="three-container">
        <slot></slot>
    </div>
</template>

<style scoped>
	/* .three-container {
		width: 100%;
		height: 100vh;
		position: relative;
	} */
</style>