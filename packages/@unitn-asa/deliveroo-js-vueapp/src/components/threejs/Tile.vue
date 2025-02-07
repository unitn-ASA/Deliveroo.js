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

        // Type selection
        var color = 0x000000; // black
        var emissiveColor;
        var opacity = 0.8;
        var width = 1, height = 0.1, depth = 1;
        switch (tile.type) {
            case 0: // None - Black
                emissiveColor = 0x505050; // grey
                // height = 1;
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
            case 5: // Obstacle - Light Blue
                color = 0x000055;
                break;
            case 6: // Yellow
                color = 0xffff00;
                break;
            default:
                break;
        }
        // Create mesh
        const geometry = new THREE.BoxGeometry( width, height, depth );
        const material = new THREE.MeshStandardMaterial( { color, transparent: true, opacity } );
        material.emissive = new THREE.Color( emissiveColor || color );
        material.emissiveIntensity = 0;
        
        mesh = new THREE.Mesh(geometry, material);
        // mesh.castShadow = true;
        // mesh.receiveShadow = true;
        
        // Place mesh on scene
        mesh.position.set( tile.x * 1.5, 0, - tile.y * 1.5 );
        mesh.translateY( - height / 2 );
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

    watch( [() => tile.hoovered, () => tile.selected ], ([hovered, selected]) => {
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

    watch( () => tile.type, (newVal) => {
        // Force UnMount and OnMount
        unmount();
        mount();
    });

    let raisingScale = true;

    function animate () {

        // slowly increase mesh scale when selected
        if ( tile.selected ) {
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

        // const d1 = Math.min( connection.configs.AGENTS_OBSERVATION_DISTANCE, connection.configs.PARCELS_OBSERVATION_DISTANCE );
        // const d2 = Math.max( connection.configs.AGENTS_OBSERVATION_DISTANCE, connection.configs.PARCELS_OBSERVATION_DISTANCE );

        // if ( Math.abs( me.value.x - tile.x ) + Math.abs( me.value.y - tile.y ) >= d2 ) {
        //     if ( mesh.material instanceof THREE.MeshStandardMaterial ) {
        //         mesh.material.emissiveIntensity = 0;
        //     }
        // }
        // else if ( Math.abs( me.value.x - tile.x ) + Math.abs( me.value.y - tile.y ) >= d1 ) {
        //     if ( mesh.material instanceof THREE.MeshStandardMaterial ) {
        //         mesh.material.emissiveIntensity = 0.3;
        //     }
        // }
        // else {
        //     // Restore mesh color if in sight.
        //     if ( mesh.material instanceof THREE.MeshStandardMaterial ) {
        //         mesh.material.emissiveIntensity = 1;
        //     }
        // }
            
        requestAnimationFrame(animate);

    };

</script>

<template>
</template>
  
<style scoped>
</style>