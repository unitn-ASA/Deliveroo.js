<script setup>
    import { onMounted, onUnmounted, watch, computed, inject, useTemplateRef } from 'vue';
    import * as THREE from 'three';
    import { CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer.js';
    import { Connection } from '@/Connection';

    /**
     * @typedef TileT
     * @type {{
     *         x: number, y: number,
     *         type: number,
     *         mesh?: THREE.Mesh }}
     */
    
    /** @type {{tile?:TileT,me?:{x,y},connection?:Connection}} */
    const props = defineProps(['tile','me','connection']);

    /** @type {TileT} */
    const tile = props.tile;

    /** @type {{x,y}} */
    const me = props.me;

    /** @type {Connection} */
    const connection = props.connection;

    var mesh;

    const scene = inject('scene');
    const camera = inject('camera');

    onMounted(() => {

        // Create mesh
        const geometry = new THREE.BoxGeometry( 1, 0.1, 1 );
        const color = ! tile.type ? 0xff0000 : 0x00ff00;
        const material = new THREE.MeshBasicMaterial( { color, transparent: true, opacity: 1 } );
        mesh = new THREE.Mesh(geometry, material);
        
        // Place mesh on scene
        mesh.position.set( tile.x * 1.5, 0, - tile.y * 1.5 );
        scene.add(mesh);
        
        // Save mesh on tile
        tile.mesh = mesh;

    });

    onUnmounted(() => {

        // Remove mesh from scene
        scene.remove(mesh);

    });

    
    function animate () {

        const d1 = Math.min( connection.configs.AGENTS_OBSERVATION_DISTANCE, connection.configs.PARCELS_OBSERVATION_DISTANCE );
        const d2 = Math.max( connection.configs.AGENTS_OBSERVATION_DISTANCE, connection.configs.PARCELS_OBSERVATION_DISTANCE );

        if ( Math.abs( me.x - tile.x ) + Math.abs( me.y - tile.y ) >= d2 )
            mesh.material.opacity = 0.1;
        else if ( Math.abs( me.x - tile.x ) + Math.abs( me.y - tile.y ) >= d1 )
            mesh.material.opacity = 0.4;
        else
            mesh.material.opacity = 1;

        requestAnimationFrame(animate);

    };

    requestAnimationFrame(animate);

</script>

<template>
</template>
  
<style scoped>
</style>