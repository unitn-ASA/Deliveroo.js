

  
<script setup>
	import { ref, onMounted, onUnmounted, provide, inject } from 'vue';
	import * as THREE from 'three';
	import { CSS2DRenderer } from 'three/examples/jsm/renderers/CSS2DRenderer.js';
	import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
	import { connection } from '@/states/myConnection.js';
	import Stats from 'three/examples/jsm/libs/stats.module.js'; //import Stats from 'three/addons/libs/stats.module.js';

    /**
     * @typedef Tile
     * @type {import("@/Grid").UITile}
     */

    /** @typedef Agent
     *  @type {import("@/Grid").UIAgent}
     */

	const threeContainer = ref(null);
	let scene, camera, renderer, labelRenderer, requestAnimationFrameID;

	scene = new THREE.Scene();
	// scene.background = new THREE.Color( 0xffffff );
	camera = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 0.1, 300 );
	renderer = new THREE.WebGLRenderer({ antialias: true }); // Consider disabling antialiasing for performance
	renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // Cap pixel ratio for performance
	// renderer.setClearColor('white');
	// // Create a WebGLRenderer and turn on shadows in the renderer
	// renderer.shadowMap.enabled = true;
	// renderer.shadowMap.type = THREE.PCFSoftShadowMap; // default THREE.PCFShadowMap
	
	// Fornisci la scena e la camera ai componenti figli
	provide('scene', scene);
	provide('camera', camera);

	/** @type {THREE.Vector3} */
	const camTarget = new THREE.Vector3(0,0,0);
	


	/**
	 * Add lights
	 */
	
	 /** @type {THREE.AmbientLight} */
	const ambientLight = new THREE.AmbientLight( 0x202020 ); // lighter if: connection.payload.role == "admin" ? 0xaaaaaa
	ambientLight.intensity = 8;
	scene.add( ambientLight );

	/** @type {THREE.PointLight} */
	const agentsLight = new THREE.PointLight( 0xffffff, 1, 1.5 * 1.2 * 5, 1.5 * 0.2 * 5 );
	
	/** @type {THREE.PointLight} */
	const parcelsLight = new THREE.PointLight( 0xffffff, 1, 1.5 * 1.2 * 5, 1.5 * 0.2 * 5 );
	// light.castShadow = true;



	/*
	 * Mouse Over and Click
	 */

	onMounted(() => {

		// Initialize Three.js scene 
		renderer.setSize(window.innerWidth, window.innerHeight);
		threeContainer.value.appendChild(renderer.domElement);

		// Initialize Clock and Stats
		const clock = new THREE.Clock();
		const stats = new Stats();
		threeContainer.value.appendChild( stats.dom );

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
        // controls.listenToKeyEvents( window ); // disable arrow keys panning
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
		/** @type {THREE.Intersection<THREE.Object3D<THREE.Object3DEventMap>>[]} */
		var intersections = []
		let hoveredObj = null;

		// let x = Math.round( hoveredObj.position.x / 1.5 );
		// let y = Math.round( - hoveredObj.position.z / 1.5 );

		labelRenderer.domElement.addEventListener( 'mousemove', ( event ) => {
			// NDC from the canvas bounding rect (clientX/Y): immune to page
			// scroll and to any container offset, unlike the previous mix of
			// clientX/pageY normalized over window.innerWidth/innerHeight
			const rect = labelRenderer.domElement.getBoundingClientRect();
			mouse.x = ( ( event.clientX - rect.left ) / rect.width ) * 2 - 1;
			mouse.y = - ( ( event.clientY - rect.top ) / rect.height ) * 2 + 1;
		} );

		labelRenderer.domElement.addEventListener( 'click', ( event ) => {
			// console.log( "clicked on", hoveredObj, x, y );
			if ( hoveredObj )
				connection.grid.selectByMesh( hoveredObj );
        } );



		/**
		 * Continuous animation loop
		 */
		const tempVector3 = new THREE.Vector3(0,0,0);
		const followPoint = new THREE.Vector3(0,0,0);
		let initialFramingDone = false;
		const animate = () => {
			
			intersections.length = 0;
			raycaster.setFromCamera( mouse, camera );
			raycaster.intersectObject( scene, true, intersections ); // intersectObject( scene ) improves performance w.r.t. intersectObjects( hoverables[] );
			// Pick the first intersection whose whole ancestor chain is
			// visible: three.js raycasting ignores the visible flag, so the
			// hidden door group carried by every tile would poison the pick
			// and kill the hover whenever the ray crosses its (invisible,
			// tile-centered) panel
			const pick = intersections.find( ( { object } ) => {
				for ( let o = object; o; o = o.parent ) {
					if ( o.visible === false ) return false;
				}
				return true;
			} );
			hoveredObj = pick?.object;
			connection.grid.hooverByMesh( pick?.object );

			
			// Follow target: selected agent, else "me", else the center of
			// the map — plain reads, re-evaluated every frame. A computed
			// would cache the pre-map fallback forever: grid.width/height
			// are plain fields, not reactive
			const followMesh = connection.grid.selectedAgent.value?.mesh ?? connection.grid.me.value?.mesh;
			if ( followMesh && ! isNaN( followMesh.position.x ) && ! isNaN( followMesh.position.y ) )
				followPoint.copy( followMesh.position );
			else
				followPoint.set( ( connection.grid.width - 1 ) / 2 * 1.5, 0, - ( connection.grid.height - 1 ) / 2 * 1.5 );

			// Initial framing: on the first frame with a known map and no
			// agent to follow, snap to the center of the map instead of
			// gliding there from 0,0. Player agents skip it: the lerp below
			// takes care of the approach to their agent
			if ( ! initialFramingDone && ! followMesh && connection.grid.width > 0 ) {
				initialFramingDone = true;
				// Preserve the current viewing offset while moving the target
				const offset = new THREE.Vector3().copy( camera.position ).sub( controls.target );
				camTarget.copy( followPoint );
				controls.target.copy( followPoint );
				camera.position.copy( followPoint ).add( offset );
				controls.update();
			}

			// Update camera following - smooth move toward target
			// This updates both camera.position and controls.target together,
			// preserving the user's manual orbit/pan adjustments.
			// Deadband: the asymptotic lerp would keep micro-moving the camera
			// forever (residual float noise), making the hover flip back and
			// forth at tile boundaries; below eps the residual is settled at
			// once instead
			if ( camTarget.distanceTo(followPoint) > 0.05 ) {
				// Current cam target (reuse existing tempVector3 to avoid allocation)
				tempVector3.copy(camTarget);
				// Lerp cam target toward the follow point
				camTarget.lerp(followPoint, 0.04);
				// Compute and apply camera offset to both camera and controls
				const diff = tempVector3.sub(camTarget);
				camera.position.sub(diff);
				controls.target.sub(diff);
			} else if ( ! camTarget.equals(followPoint) ) {
				// Snap the residual: settle once, then stay perfectly still
				tempVector3.copy(camTarget);
				camTarget.copy(followPoint);
				const diff = tempVector3.sub(camTarget);
				camera.position.sub(diff);
				controls.target.sub(diff);
			}
			// required if controls.enableDamping or controls.autoRotate are set to true
			controls.update();
			stats.update();
			renderer.render(scene, camera);
			labelRenderer.render(scene, camera);

			requestAnimationFrameID = requestAnimationFrame(animate);
		};

		// Start animation loop
		requestAnimationFrameID = requestAnimationFrame(animate);

		// Gestisci il ridimensionamento della finestra
		window.addEventListener('resize', onWindowResize);

	});

	onUnmounted(() => {
		// Stop the animation loop, otherwise it will continue to run even when the component is unmounted, creating weird bugs
		cancelAnimationFrame(requestAnimationFrameID); // this fixes the hoovering issue when switching to another ThreeScene instance
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