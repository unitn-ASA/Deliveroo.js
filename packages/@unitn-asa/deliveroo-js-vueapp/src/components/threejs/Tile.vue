<script setup>
    import { onMounted, onUnmounted, watch, computed, inject, useTemplateRef } from 'vue';
    import * as THREE from 'three';
    import { CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer.js';
    import { Connection } from '@/Connection';
    import { connection } from '@/states/myConnection.js';

    /**
     * @typedef Tile
     * @type {import("@/Grid").Tile}
     */

    /** @typedef Agent
     *  @type {import("@/Grid").Agent}
     */
    
    /** @type {{tile?:Tile,me?:{x,y},connection?:Connection}} */
    const props = defineProps(['tile','me','connection']);

    /** @type {Tile} */
    const tile = props.tile;

    /** @type {import("vue").Ref<Agent>} */
    const me = connection.grid.me;
    
    // /** @type {Connection} */
    // const connection = props.connection;

    /** @type {THREE.Mesh} */
    var mesh;

    const scene = inject('scene');
    const camera = inject('camera');

    function mount () {

        // Create mesh
        const geometry = new THREE.BoxGeometry( 1, ( tile.type == 0 ? 1 : 0.1 ), 1 );
        var color;
        switch (tile.type) {
            case 0: // Obstacle - Light Blue
                color = 0x000055;
                break;
            case 1: // Spawning - Green
                color = 0x00ff00;
                break;
            case 2: // Delivery - Red
                color = 0xff0000;
                break;
            case 3: // Walkable - White
                color = 0xffffff;
                break;
            case 4: // Base - Blue
                color = 0x0000ff;
                break;
            default:
                break;
        }
        const material = new THREE.MeshStandardMaterial( { color, transparent: true, opacity: 1 } );
        material.emissive = new THREE.Color( color );
        material.emissiveIntensity = 0;
        
        mesh = new THREE.Mesh(geometry, material);
        // mesh.castShadow = true;
        // mesh.receiveShadow = true;
        
        // Place mesh on scene
        mesh.position.set( tile.x * 1.5, 0, - tile.y * 1.5 );
        mesh.translateY( tile.type == 0 ? 0.5 : 0 );
        scene.add(mesh);
        
        // Save mesh on tile
        tile.mesh = mesh;

        // Start animation
        requestAnimationFrame(animate);

    }

    function unmount () {

        // Remove mesh from scene
        scene.remove(mesh);

    }

    onMounted(() => {
        mount();
    });

    onUnmounted(() => {
        unmount();
    });

    watch( () => tile.type, (newVal) => {
        // Force UnMount and OnMount
        unmount();
        mount();

        // // Update mesh color
        // var color;
        // switch (newVal) {
        //     case 0: // Obstacle - Light Blue
        //         color = 0x000055;
        //         break;
        //     case 1: // Spawning - Green
        //         color = 0x00ff00;
        //         break;
        //     case 2: // Delivery - Red
        //         color = 0xff0000;
        //         break;
        //     case 3: // Walkable - White
        //         color = 0xffffff;
        //         break;
        //     case 4: // Base - Blue
        //         color = 0x0000ff;
        //         break;
        //     default:
        //         break;
        // }
        // mesh.material.color = new THREE.Color(color);
        // mesh.material.emissive = new THREE.Color(color);
        // mesh.material.emissiveIntensity = 0;
    });

    function animate () {

        const d1 = Math.min( connection.configs.AGENTS_OBSERVATION_DISTANCE, connection.configs.PARCELS_OBSERVATION_DISTANCE );
        const d2 = Math.max( connection.configs.AGENTS_OBSERVATION_DISTANCE, connection.configs.PARCELS_OBSERVATION_DISTANCE );

        if ( Math.abs( me.x - tile.x ) + Math.abs( me.y - tile.y ) >= d2 ) {
            if ( mesh.material instanceof THREE.MeshStandardMaterial ) {
                mesh.material.opacity = 0.7;
                mesh.material.emissiveIntensity = 0.3;
            }
        }
        else if ( Math.abs( me.x - tile.x ) + Math.abs( me.y - tile.y ) >= d1 ) {
            if ( mesh.material instanceof THREE.MeshStandardMaterial ) {
                mesh.material.opacity = 0.8;
                mesh.material.emissiveIntensity = 0.4;
            }
        }
        else {
            // Restore mesh color if in sight.
            if ( mesh.material instanceof THREE.MeshStandardMaterial ) {
                mesh.material.opacity = 0.9;
                mesh.material.emissiveIntensity = 0.5;
            }
        }
            
        requestAnimationFrame(animate);

    };

</script>

<template>
</template>
  
<style scoped>
</style>