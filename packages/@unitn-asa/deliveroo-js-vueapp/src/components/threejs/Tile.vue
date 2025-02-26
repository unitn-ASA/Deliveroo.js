<script setup>
    import { onMounted, onUnmounted, watch, computed, inject, useTemplateRef } from 'vue';
    import * as THREE from 'three';
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
    const props = defineProps(['tile']);

    /** @type {Tile} */
    const tile = props.tile;

    /** @type {THREE.MeshStandardMaterial} */
    const material = new THREE.MeshStandardMaterial( { color: 0x000000, transparent: true, opacity: 0.3 } );
    material.emissiveIntensity = 0;

    /** @type {THREE.BoxGeometry} */
    const geometry = new THREE.BoxGeometry( 1, 0.1, 1 );

    /** @type {THREE.Mesh} */
    const mesh = tile.mesh = new THREE.Mesh(geometry, material);
    mesh.position.set( tile.x * 1.5, - 0.1 / 2, - tile.y * 1.5 );

    const scene = inject('scene');
    const camera = inject('camera');
    
    onMounted(() => {
        scene.add(mesh);
    });
    
    onUnmounted(() => {
        // Remove mesh from scene
        scene.remove(mesh);
    });

    // Set scale and emissiveIntensity based on selection or hoovering
    watch( [() => tile.hoovered, () => tile.selected ], ([hovered, selected]) => {
        if ( hovered ) {
            mesh.scale.set( 1.5, 1.5, 1.5 );
            material.emissiveIntensity = 1;
        } else if ( selected ) {
            mesh.scale.set( 1.3, 1.3, 1.3 );
            material.emissiveIntensity = 1;
        } else {
            mesh.scale.set( 1, 1, 1 );
            material.emissiveIntensity = 0;
        }
    });

    watch( [ () => connection.grid.me.value.x, () => connection.grid.me.value.y, () => connection.configs ], ( [ x, y ] ) => {

        let AOD = connection.configs.AGENTS_OBSERVATION_DISTANCE;
        let POD = connection.configs.PARCELS_OBSERVATION_DISTANCE;
        let MinOD = Math.min( AOD, POD );
        let MaxOD = Math.max( AOD, POD );

        let dist = Math.abs( x - tile.x ) + Math.abs( y - tile.y );

        if ( dist < MinOD ) {
            material.opacity = 1;
        }
        else if ( dist < MaxOD ) {
            material.opacity = 0.6;
        }
        else {
            material.opacity = 0.1;
        }

    }, { immediate: true } );

    // Set color and emissive color based on type
    watch( () => tile.type, (newVal) => {
        var color = 0x000000; // black
        var emissiveColor;
        var opacity = 1;
        switch (tile.type.toString()) {
            case "0": // None - Black
                color = 0x000000;
                emissiveColor = 0x444444;
                // opacity = 0.3;
                break;
            case "1": // Spawning - Green
                color = 0x00ff00;
                emissiveColor = 0x44ff44;
                break;
            case "2": // Delivery - Red
                color = 0xff0000;
                emissiveColor = 0xff4444;
                break;
            case "3": // Walkable - White
                color = 0xffffff;
                emissiveColor = 0xff99ff;
                break;
            case "4": // Base - Blue
                color = 0x0000ff;
                emissiveColor = 0x4444ff;
                break;
            case '5': // Obstacle - Yellow
                color = 0xffff00;
                emissiveColor = 0xffff44;
                break;
            default:
                break;
        }
        // Set color and emissive color
        material.color = new THREE.Color( color );
        material.emissive = new THREE.Color( emissiveColor || color );
        material.opacity = opacity;
    }, { immediate: true });



    let raisingScale = true;
    
    // slowly increase mesh scale when selected
    function animate () {
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
        requestAnimationFrame(animate);
    };
    
    // Start animation
    // requestAnimationFrame(animate); // commented out to improve performances

</script>

<template>
</template>
  
<style scoped>
</style>