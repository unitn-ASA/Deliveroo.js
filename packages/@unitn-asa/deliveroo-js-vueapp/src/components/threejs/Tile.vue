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
    const material = new THREE.MeshStandardMaterial( { color: 0x000000, transparent: true, opacity: 0.8 } );
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
            material.emissiveIntensity = 0.5;
        } else if ( selected ) {
            mesh.scale.set( 1.3, 1.3, 1.3 );
            material.emissiveIntensity = 0.3;
        } else {
            mesh.scale.set( 1, 1, 1 );
            material.emissiveIntensity = 0;
        }
    });

    // Set color and emissive color based on type
    watch( () => tile.type, (newVal) => {
        var color = 0x000000; // black
        var emissiveColor;
        var opacity = 1;
        switch (tile.type.toString()) {
            case "0": // None - Black
                // color = 0x111111
                emissiveColor = 0xffffff;
                opacity = 0.3;
                break;
            case "1": // Spawning - Green
                color = 0x00ff00;
                break;
            case "2": // Delivery - Red
                color = 0xff0000;
                break;
            case "3": // Walkable - White
                color = 0xffffff;
                break;
            case "4": // Base - Blue
                color = 0x0000ff;
                break;
            case '5': // Obstacle - Light Blue
                color = 0x000055;
                break;
            case '6': // Yellow
                color = 0xffff00;
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
    requestAnimationFrame(animate);

</script>

<template>
</template>
  
<style scoped>
</style>