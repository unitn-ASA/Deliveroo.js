<script setup>
    import { onMounted, onUnmounted, ref, inject, watch, useTemplateRef } from 'vue';
    import * as THREE from 'three';
    import { CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer.js';

    /** @typedef Agent
     *  @type {import("@/Grid").Agent}
     */
    
    /** @type {{agent?:Agent}} */
    const props = defineProps(['agent']);
    
    /** @type {Agent} */
    const agent = props.agent;

    // /** @type {import('vue').ComputedRef<string>} */
    // const labelText = computed(() => agent.name);

    const labelContainer = useTemplateRef("labelContainer");

    /** @type {THREE.Mesh} */
    var mesh;
    /** @type {CSS2DObject} */
    var label;

    const scene = inject('scene');
    const camera = inject('camera');


    onMounted(() => {
        // Create mesh
        const geometry = new THREE.ConeGeometry( 0.5, 1, 32 );
        const color = new THREE.Color( Math.random() * 0xffffff ); // color.setHex( Math.random() * 0xffffff );
        const material = new THREE.MeshBasicMaterial( { color, transparent: true, opacity: 1 } );
        mesh = new THREE.Mesh( geometry, material );

        // Save mesh in agent
        agent.mesh = mesh;

        // Place mesh on scene
        mesh.position.set(agent.x*1.5, 0.5, -agent.y*1.5);
        scene.add(mesh);

        // Add label
        label = new CSS2DObject(labelContainer.value);
        label.position.set(0, 0.5, 0);
        mesh.add(label);

    });

    onUnmounted(() => {
        // Remove mesh from scene 
        agent.mesh.remove(label);
        scene.remove(mesh);
        agent.mesh.geometry.dispose();
        // console.log( 'Agent.vue onUnmounted() agent.mesh:', agent.mesh );
    });

    watch( [() => agent.hoovered, () => agent.selected ], ([hovered, selected]) => {
        if ( hovered ) {
            mesh.scale.set( 1.5, 1.5, 1.5 );
            mesh.material.emissiveIntensity = 0.5;
        } else if ( selected ) {
            mesh.scale.set( 1.3, 1.3, 1.3 );
            mesh.material.emissiveIntensity = 0.3;
        } else {
            mesh.scale.set( 1, 1, 1 );
            mesh.material.emissiveIntensity = 0;
        }
    });

    function animate () {

        let targetVector3 = new THREE.Vector3( Math.round(agent.x) * 1.5, agent.mesh.position.y, - Math.round(agent.y) * 1.5 );

        if ( agent.x == Math.round(agent.x) && agent.y == Math.round(agent.y) ) { // if arrived
            agent.mesh.position.lerp( targetVector3, 0.5 );
        } else { // if still moving
            // targetVector3 = new THREE.Vector3( this.x * 1.5, this.#mesh.position.y, - this.y * 1.5 );
            agent.mesh.position.lerp( targetVector3, 0.08 );
        }

        requestAnimationFrame(animate);

    };

    requestAnimationFrame(animate);
    
</script>

<template>
    <div>
        <div ref="labelContainer" class="label">{{ agent.name }}</div>
    </div>
</template>
  
<style scoped>
/* .label {
    font-size: 2rem !important;
} */
</style>