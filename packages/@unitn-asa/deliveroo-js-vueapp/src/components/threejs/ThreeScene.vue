

  
<script setup>
	import { ref, onMounted, onUnmounted, provide, computed, inject, watch } from 'vue';
	import * as THREE from 'three';
	import { CSS2DRenderer } from 'three/examples/jsm/renderers/CSS2DRenderer.js';
	import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
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
	// scene.background = new THREE.Color( 0xffffff );
	camera = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 0.1, 300 );
	renderer = new THREE.WebGLRenderer();
	// renderer.setClearColor('white');
	// // Create a WebGLRenderer and turn on shadows in the renderer
	// renderer.shadowMap.enabled = true;
	// renderer.shadowMap.type = THREE.PCFSoftShadowMap; // default THREE.PCFShadowMap
	
	// Fornisci la scena e la camera ai componenti figli
	provide('scene', scene);
	provide('camera', camera);

	/** @type {import('vue').Ref<THREE.Mesh>} */
    const targetMesh = computed( () => {
		// if x is a number
		if ( ! isNaN( connection.grid.selectedAgent.value?.mesh?.position.x ) && ! isNaN( connection.grid.selectedAgent.value?.mesh?.position.y ) )
			return connection.grid.selectedAgent.value?.mesh
		if ( ! isNaN( connection.grid.me.value?.mesh?.position.x ) && ! isNaN( connection.grid.me.value?.mesh?.position.y ) )
			return connection.grid.me.value.mesh
		// pick central tile in connection.grid.tiles
		const midX = connection.grid.width / 2 - 2;
		const midY = connection.grid.height / 2 - 2;
		const targetMesh = new THREE.Mesh();
		targetMesh.position.set( midX * 1.5, 0, - midY * 1.5 );
		// scene.add( targetMesh );
		return targetMesh;
	});

	/** @type {THREE.Vector3} */
	const camTarget = new THREE.Vector3(0,0,0);
	


	/**
	 * Add lights
	 */
	
	 /** @type {THREE.AmbientLight} */
	const ambientLight = new THREE.AmbientLight( 0x202020 ); // lighter if: connection.payload.role == "admin" ? 0xaaaaaa
	scene.add( ambientLight );

	/** @type {THREE.PointLight} */
	const agentsLight = new THREE.PointLight( 0xffffff, 1, 1.5 * 1.2 * 5, 1.5 * 0.2 * 5 );
	
	/** @type {THREE.PointLight} */
	const parcelsLight = new THREE.PointLight( 0xffffff, 1, 1.5 * 1.2 * 5, 1.5 * 0.2 * 5 );
	// light.castShadow = true;

	function computeLightDistanceAndDecay( light, distance ) {
		// console.log( 'ThreeScene.js computeLightDistanceAndDecay', distance );
		if ( ! isNaN( distance ) ) {
			// light.position.set( 0, 5, 0 );
			// light.distance = 0.9 * distance + 4;
			// light.decay = 0.4;
			// targetMesh.value?.add( light );
		}
	}

	watch( [ () => connection.configs.AGENTS_OBSERVATION_DISTANCE, () => connection.configs.PARCELS_OBSERVATION_DISTANCE ], ([AOD, POD]) => {
		ambientLight.intensity = isNaN( AOD ) || isNaN( POD) ? 8 : 1;
		computeLightDistanceAndDecay( agentsLight, AOD );
		computeLightDistanceAndDecay( parcelsLight, POD);
	}, { immediate: true } );

	watch( () => targetMesh.value, (newVal) => {
		// console.log( 'ThreeScene.js watch targetMesh', newVal.position, targetMesh.value.position );
		targetMesh.value?.remove( agentsLight );
		targetMesh.value?.remove( parcelsLight );
		// targetMesh.value?.add( agentsLight );
		// targetMesh.value?.add( parcelsLight );
		computeLightDistanceAndDecay( agentsLight, connection.configs.AGENTS_OBSERVATION_DISTANCE );
		computeLightDistanceAndDecay( parcelsLight, connection.configs.PARCELS_OBSERVATION_DISTANCE);
	}, { immediate: true } );



	/*
	 * Mouse Over and Click
	 */

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


		/**
		 * Mouse hoover and click events
		 * 
		 * https://github.com/mrdoob/three.js/blob/master/examples/misc_controls_drag.html
		 * const drag_controls = new DragControls( clickables, camera, labelRenderer.domElement );
		 * drag_controls.addEventListener( 'hoveron', (event) => hovered = event.object );
		 * drag_controls.addEventListener( 'hoveroff', (event) => hovered = null );
		 */

        const mouse = new THREE.Vector2();
        const raycaster = new THREE.Raycaster();
		let hoveredObj = null;
		// let x = Math.round( hoveredObj.position.x / 1.5 );
		// let y = Math.round( - hoveredObj.position.z / 1.5 );

		labelRenderer.domElement.addEventListener( 'mousemove', ( event ) => {
			// console.log( 'mousemove', event, event.clientX, event.clientY, mouse );
			mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
			mouse.y = - ( event.pageY / window.innerHeight ) * 2 + 1;
			raycaster.setFromCamera( mouse, camera );
			const intersections = raycaster.intersectObjects( hoverable.value, true );
			hoveredObj = intersections[ 0 ]?.object;
			// if (hoveredObj instanceof THREE.Mesh)
			connection.grid.hooverByMesh( hoveredObj );
		} );

		labelRenderer.domElement.addEventListener( 'click', ( event ) => {
			// console.log( "clicked on", hoveredObj, x, y );
			if ( hoveredObj )
				connection.grid.selectByMesh( hoveredObj );
        } );



		/**
		 * Camera following target
		 */

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