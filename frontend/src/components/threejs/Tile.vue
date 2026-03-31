<script setup>
    import { onMounted, onUnmounted, watch, computed, inject, useTemplateRef } from 'vue';
    import * as THREE from 'three';
    import { Connection } from '@/Connection.js';
    import { connection } from '@/states/myConnection.js';
    import { getTileTextures } from '@/utils/threejs/textures.js';

    /**
     * @typedef Tile
     * @type {import("@/Grid.js").UITile}
     */

    /** @typedef Agent
     *  @type {import("@/Grid.js").UIAgent}
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
            // material.emissiveIntensity = 1;
        } else if ( selected ) {
            mesh.scale.set( 1.3, 1.3, 1.3 ); // replaced by animation below
            // material.emissiveIntensity = 1;
        } else {
            mesh.scale.set( 1, 1, 1 );
            // material.emissiveIntensity = 0;
        }
    });

    watch( () => tile.sensed, () => {

        material.opacity = tile.sensed ? 1 : 0.3;

    }, { immediate: true } );

    // Get static textures (cached globally)
    /** @type {{ crateSpawner: THREE.CanvasTexture, 'dir_↑': THREE.CanvasTexture, 'dir_→': THREE.CanvasTexture, 'dir_↓': THREE.CanvasTexture, 'dir_←': THREE.CanvasTexture }} */
    const textures = getTileTextures();

    const TILE_STYLES = {
        '0': {                                      // None
            color: 0x000000,    // black
            emissive: 0x444444  // dark gray
        },
        '1': {                                      // Spawning
            color: 0x00ff00,    // green
            emissive: 0x44ff44  // light green
        },
        '2': {                                      // Delivery
            color: 0xff0000,    // red
            emissive: 0xff4444  // light red
        },
        '3': {                                      // Walkable
            color: 0xffffff,    // white
            emissive: 0xff99ff  // light pink
        },
        '4': {                                      // Base
            color: 0x0000ff,    // blue
            emissive: 0x4444ff  // light blue
        },
        '5': {                                      // Crate sliding
            color: 0xffff00,    // yellow
            emissive: 0xffff44  // light yellow
        },
        '5!': {                                      // Crate sliding & spawner
            color: 0xffff00,    // yellow
            emissive: 0xffff44, // light yellow
            texture: textures.crateSpawner
        },
        '↑': {
            color: 0xffffff,    // white
            emissive: 0xffffff, // white
            texture: textures['dir_↑']
        },
        '→': {
            color: 0xffffff,    // white
            emissive: 0xffffff, // white
            texture: textures['dir_→']
        },
        '↓': {
            color: 0xffffff,    // white
            emissive: 0xffffff, // white
            texture: textures['dir_↓']
        },
        '←': {
            color: 0xffffff,    // white
            emissive: 0xffffff, // white
            texture: textures['dir_←']
        }
    };

    // Set color and emissive color based on type
    watch( () => tile.type, (newVal) => {
        const key = String(newVal);
        const style = TILE_STYLES[key];

        if (!style) return;

        // Clear texture by default
        material.map = null;

        // Apply colors
        material.color.setHex(style.color);
        material.emissive.setHex(style.emissive ?? style.color);

        // Apply texture if present
        if (style.texture) {
            material.map = style.texture;
        }

        material.needsUpdate = true;

    }, { immediate: true });



    // Animation variables
    let isScalingUp = true;
    
    // slowly increase mesh scale when selected
    function animate () {
        if ( tile.selected ) {
            if ( isScalingUp ) {
                mesh.scale.x += ( 2 - mesh.scale.x ) * 0.05;
                mesh.scale.z += ( 2 - mesh.scale.z ) * 0.05;
            }
            else {
                mesh.scale.x -= 0.05;
                mesh.scale.z -= 0.05;
            }

            if ( mesh.scale.x > 1.8 )
                isScalingUp = false;
            else if ( mesh.scale.x < 1.3 )
                isScalingUp = true;
        }   
        requestAnimationFrame(animate);
    };
    
    // Start animation
    // requestAnimationFrame(animate); // Comment to improve performances

</script>

<template>
</template>
  
<style scoped>
</style>