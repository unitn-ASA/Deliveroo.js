<script setup>
    import { onMounted, onUnmounted, ref, inject, watch, useTemplateRef } from 'vue';
    import * as THREE from 'three';
    import { CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer.js';
    import { connection } from '@/states/myConnection';

    /** @typedef Agent
     *  @type {import("@/Grid").Agent}
     */
    
    /** @type {{agent?:Agent}} */
    const props = defineProps(['agent']);
    
    /** @type {Agent} */
    const agent = props.agent;

    const scene = inject('scene');
    const camera = inject('camera');

    // Create mesh
    const geometry = new THREE.ConeGeometry( 0.5, 1, 32 );
    const color = new THREE.Color( Math.random() * 0xffffff ); // color.setHex( Math.random() * 0xffffff );
    const material = new THREE.MeshBasicMaterial( { color, transparent: true, opacity: 1 } );
    /** @type {THREE.Mesh} */
    const mesh = agent.mesh = new THREE.Mesh( geometry, material );
    mesh.position.set(agent.x*1.5, 0.5, -agent.y*1.5);

    // Create label
    const labelContainer = useTemplateRef("labelContainer");
    /** @type {CSS2DObject} */
    var label;
    
    // Create lights
    /** @type {THREE.Mesh} */
    var lightRoot;


    onMounted(() => {
        // Place mesh on scene
        scene.add(mesh);

        // Place label on mesh
        label = new CSS2DObject(labelContainer.value);
        label.position.set(0, 0.5, 0);
        mesh.add(label);

        // Add lights
        if ( connection.payload.id == agent.id ) {
            lightRoot = new THREE.Mesh();
            let AOD = connection.configs.AGENTS_OBSERVATION_DISTANCE
            for ( let i = - AOD; i < AOD; i ++ ) {
                for ( let j = - AOD; j < AOD; j ++ ) {
                    if ( Math.abs(i) + Math.abs(j) < AOD ) {
                        const light = new THREE.PointLight( 0xffffff, 8, 1.4, 0.9 );
                        light.position.set( i*1.5, 1, j*1.5 );
                        lightRoot.add( light );
                    }
                }
            }
            scene.add( lightRoot );
        }

    });

    onUnmounted(() => {
        // Remove mesh from scene 
        agent.mesh.remove(label);
        scene.remove(mesh);
        agent.mesh.geometry.dispose();
        if ( lightRoot ) {
            scene.remove(lightRoot);
            lightRoot.children.forEach( light => light.dispose() );
            lightRoot.geometry.dispose();
        }
        // console.log( 'Agent.vue onUnmounted() agent.mesh:', agent.mesh );
    });

    watch( [() => agent.hoovered, () => agent.selected ],
        ([hovered, selected], [wasHovered, wasSelected]) => {
            if ( hovered ) {
                mesh.scale.set( 1.3, 1.3, 1.3 );
                mesh.position.y = 0.7;
                mesh.material.emissiveIntensity = 0.5;
            } else if ( selected ) {
                mesh.scale.set( 1.2, 1.2, 1.2 );
                mesh.position.y = 0.7;
                mesh.material.emissiveIntensity = 0.3;
            } else {
                mesh.scale.set( 1, 1, 1 );
                mesh.position.y = 0.5;
                mesh.material.emissiveIntensity = 0;
            }
        }
    );

    watch( () => agent.status, (status, oldStatus) => {
        if ( oldStatus == 'offline' ) {
            mesh.add(label);
            scene.add(mesh);
        }
        if ( status == 'online') {
            material.opacity = 1;
        } else if ( status == 'out of range' ) {
            material.opacity = 0.3;
        } else if ( status == 'offline' ) {
            mesh.remove(label);
            scene.remove(mesh);
        }
    });

    function animate () {

        let agentTargetVector3 = new THREE.Vector3( Math.round(agent.x) * 1.5, agent.mesh.position.y, - Math.round(agent.y) * 1.5 );
        let lightTargetVector3 = new THREE.Vector3( Math.round(agent.x) * 1.5, lightRoot?.position.y, - Math.round(agent.y) * 1.5 );

        if ( agent.x == Math.round(agent.x) && agent.y == Math.round(agent.y) ) { // if arrived
            agent.mesh.position.lerp( agentTargetVector3, 0.5 );
            lightRoot?.position.lerp( lightTargetVector3, 0.5 );
        } else { // if still moving
            // targetVector3 = new THREE.Vector3( this.x * 1.5, this.#mesh.position.y, - this.y * 1.5 );
            agent.mesh.position.lerp( agentTargetVector3, 0.08 );
            lightRoot?.position.lerp( lightTargetVector3, 0.08 );
        }

        requestAnimationFrame(animate);

    };

    requestAnimationFrame(animate);
    
</script>

<template>
    <div>
        <div ref="labelContainer"
             class="label"
             :class="{
                'opacity-20': agent.status == 'out of range',
             }" >
            {{ agent.name }}
        </div>
    </div>
</template>
  
<style scoped>
</style>