<script setup>
    import { onMounted, onUnmounted, watch, inject, computed, useTemplateRef } from 'vue';
    import * as THREE from 'three';
    import { CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer.js';
	import { connection } from '@/states/myConnection.js';
    
    /**
     * @typedef Parcel
     * @type {import("@/Grid").Parcel}
     */

    // const props = defineProps({
    //     id: String,
    //     x: Number,
    //     y: Number,
    //     z: Number,
    //     color: Number,
    //     label: Number
    // });
    
    /** @type {{parcel?:Parcel}} */
    const props = defineProps(['parcel']);
    
    /** @type {Parcel} */
    const parcel = props.parcel;

    /** @type {import('vue').ComputedRef<string>} */
    const labelText = computed(() => ''+parcel.reward);

    const labelContainer = useTemplateRef("labelContainer");
    
    /** @type {THREE.Mesh} */
    var mesh;

    /** @type {CSS2DObject} */
    var label;

    /** @type {THREE.Scene} */
    const scene = inject('scene');
    const camera = inject('camera');

    onMounted(() => {

        // Crea il cubo
        const geometry = new THREE.BoxGeometry( 0.5, 0.5, 0.5 );
        var color = new THREE.Color( 0xffffff );
        color.setHex( Math.random() * 0xffffff );
        const material = new THREE.MeshBasicMaterial( { color, transparent: true, opacity: 1 } );
        mesh = new THREE.Mesh( geometry, material );
        parcel.mesh = mesh;
        // mesh.position.set( parcel.x * 1.5, 0.5, - parcel.y * 1.5 );
        // scene.add(mesh);
        placeOnSceneOrAgent();


        // Aggiungi un'etichetta CSS2DObject
        label = new CSS2DObject(labelContainer.value);
        label.position.set(0, 0.3, 0);
        if (labelText) mesh.add(label);

        // Watch per monitorare le modifiche alle proprietà
        // watch(() => [parcel.x, parcel.y], ([newX, newY]) => {
        //     animatePosition( mesh, parcel.x * 1.5, 0.5, - parcel.y * 1.5 );
        // });

        // Start animation
        requestAnimationFrame(animate);

    });

    onUnmounted(() => {
        // Rimuovi il cubo dalla scena
        mesh.remove(label);
        scene.remove(mesh);
        if ( parcel.carriedBy ) connection.grid.getOrCreateAgent( parcel.carriedBy ).mesh?.remove( mesh );
        mesh.geometry.dispose();

        // delete html from dom
        // labelRef.value.remove();
    });

    watch( [() => parcel.hoovered, () => parcel.selected ], ([hovered, selected]) => {
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

    // When carriedBy changes, move the parcel to the agent or to the scene
    watch(() => parcel.carriedBy, ( agentId, oldAgentId ) => {
        // console.log( 'Parcel.vue watch parcel.carriedBy agentId, oldAgentId', agentId, oldAgentId );
        placeOnSceneOrAgent()
    });

    // When the number of parcels changes, re-arrange the parcels to the right height
    watch ( () => connection.grid.parcels.size, () => {
        placeOnSceneOrAgent();
    });

    function placeOnSceneOrAgent () {
        if ( parcel.carriedBy ) {
            const agent = connection.grid.getOrCreateAgent( parcel.carriedBy );
            // scene.remove( mesh );
            agent.mesh?.add( mesh );
            mesh.position.x = 0;
            mesh.position.z = 0;
            mesh.position.y = agent.carrying.indexOf( parcel.id ) * 0.8 + 1.5;
        } else {
            // oldAgent.mesh?.remove( mesh );
            scene.add( mesh );
            mesh.position.x = parcel.x * 1.5;
            mesh.position.z = - parcel.y * 1.5;
            // mesh.position.y = 0.5;
            connection.grid.getParcelsAt( parcel.x, parcel.y ).forEach( (p, i) => {
                if ( p.mesh) p.mesh.position.y = i * 0.8 + 0.5;
            });
        }
    }


    let raisingScale = true;

    function animate () {

        // slowly increase mesh scale when selected
        if ( parcel.selected ) {
            if ( raisingScale ) {
                mesh.scale.x += ( 2 - mesh.scale.x ) * 0.05;
                mesh.scale.z += ( 2 - mesh.scale.z ) * 0.05;
            }
            else {
                mesh.scale.x -= 0.05;
                mesh.scale.z -= 0.05;
            }

            if ( mesh.scale.x > 1.8 )
                raisingScale = false;
            else if ( mesh.scale.x < 1.3 )
                raisingScale = true;
        }
    
        requestAnimationFrame(animate);
    
    }

</script>

<template>
    <div>
        <div ref="labelContainer" class="label">{{ labelText }}</div>
    </div>
</template>
  
<style scoped>
    .label {
        background: rgba(0, 0, 0, 0.5) !important;
    }
</style>