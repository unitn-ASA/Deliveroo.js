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

    // Door portal for tile type '7': two posts, a lintel, a semi-transparent
    // panel and a golden knob, standing on the tile so the door is clearly
    // visible from any angle (agents are still visible while crossing it)
    const doorFrameMaterial = new THREE.MeshStandardMaterial( { color: 0x451a03 } );            // dark brown
    const doorPanelMaterial = new THREE.MeshStandardMaterial( {
        color: 0x92400e,                                                                        // brown
        emissive: 0xb45309,                                                                     // light brown
        emissiveIntensity: 0.4,
        transparent: true,
        opacity: 0.55
    } );
    const doorKnobMaterial = new THREE.MeshStandardMaterial( { color: 0xfacc15, emissive: 0xfde047, emissiveIntensity: 0.5 } );

    const doorGroup = new THREE.Group();

    const doorPostGeometry = new THREE.BoxGeometry( 0.15, 1.1, 0.15 );
    const doorPostLeft = new THREE.Mesh( doorPostGeometry, doorFrameMaterial );
    doorPostLeft.position.set( - 0.42, 0.55, 0 );
    const doorPostRight = new THREE.Mesh( doorPostGeometry, doorFrameMaterial );
    doorPostRight.position.set( 0.42, 0.55, 0 );

    const doorLintel = new THREE.Mesh( new THREE.BoxGeometry( 1.0, 0.15, 0.15 ), doorFrameMaterial );
    doorLintel.position.set( 0, 1.16, 0 );

    const doorPanel = new THREE.Mesh( new THREE.BoxGeometry( 0.7, 0.95, 0.06 ), doorPanelMaterial );
    doorPanel.position.set( 0, 0.5, 0 );

    const doorKnob = new THREE.Mesh( new THREE.SphereGeometry( 0.045, 12, 12 ), doorKnobMaterial );
    doorKnob.position.set( 0.22, 0.5, 0.06 );

    doorGroup.add( doorPostLeft, doorPostRight, doorLintel, doorPanel, doorKnob );
    doorGroup.visible = false;
    mesh.add( doorGroup );

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
        '6': {                                      // Battery spawner
            color: 0xf97316,    // orange
            emissive: 0xfdba74  // light orange
        },
        '7': {                                      // Door
            color: 0x92400e,    // brown
            emissive: 0xb45309  // light brown
        },
        '8': {                                      // Key spawner
            color: 0xfacc15,    // gold
            emissive: 0xfde047  // light gold
        },
        '9': {                                      // Double delivery
            color: 0x7f1d1d,    // dark red
            emissive: 0x991b1b  // red
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

        // The portal is only shown on door tiles
        doorGroup.visible = key === '7';

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