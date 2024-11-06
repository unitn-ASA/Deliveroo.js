

  
<script setup>
	import { ref, onMounted, onUnmounted, provide, defineProps, inject, watch } from 'vue';
	import * as THREE from 'three';
	import { CSS2DRenderer } from 'three/examples/jsm/renderers/CSS2DRenderer.js';
	import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
	import { Controller } from '../../utils/Controller.js'

    /** @type {import("@/Connection").Connection} */
    const connection = inject( "connection" ).value;

	const threeContainer = ref(null);
	let scene, camera, renderer, labelRenderer;

	scene = new THREE.Scene();
	camera = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 0.1, 300 );
	renderer = new THREE.WebGLRenderer();
	
	// Fornisci la scena e la camera ai componenti figli
	provide('scene', scene);
	provide('camera', camera);

	// const props = defineProps( ['targetMesh'] );
    /** @type {import('vue').Ref<THREE.Mesh>} */
    const targetMesh = defineModel()

	/** @type {THREE.Vector3} */
	const camTarget = new THREE.Vector3(0,0,0);

	watch( () => targetMesh.value, (newVal) => {
		console.log( 'ThreeScene.js watch targetMesh', newVal.position, targetMesh.value.position );
		// camTarget.copy( targetMesh.value.position );
		// targetMesh.value.position.addScalar( 1 )
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