<script setup>
    import { onMounted, onUnmounted, watch, computed, inject, useTemplateRef } from 'vue';
    import * as THREE from 'three';
    import { Connection } from '@/Connection.js';
    import { connection } from '@/states/myConnection.js';

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

    watch( [ () => tile.perceivingAgents, () => tile.perceivingParcels, () => tile.perceivingCrates ], () => {

        // console.log('Tile.vue tile', tile.x, tile.y, tile.perceivingAgents?'perceivingAgents':'', tile.perceivingParcels?'perceivingParcels':'', tile.perceivingCrates?'perceivingCrates':'' );

        const perceptionCount = [tile.perceivingAgents, tile.perceivingParcels, tile.perceivingCrates].filter(Boolean).length;

        if ( perceptionCount >= 2 ) {
            material.opacity = 1;
        }
        else if ( perceptionCount === 1 ) {
            material.opacity = 0.6;
        }
        else {
            material.opacity = 0.2;
        }

    }, { immediate: true } );

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
            texture: createCrateSpawnerTexture()
        },
        '↑': {
            color: 0xffffff,    // white
            emissive: 0xffffff, // white
            texture: () => createDirectionalTexture('↑')
        },
        '→': {
            color: 0xffffff,    // white
            emissive: 0xffffff, // white
            texture: () => createDirectionalTexture('→')
        },
        '↓': {
            color: 0xffffff,    // white
            emissive: 0xffffff, // white
            texture: () => createDirectionalTexture('↓')
        },
        '←': {
            color: 0xffffff,    // white
            emissive: 0xffffff, // white
            texture: () => createDirectionalTexture('←')
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
            material.map = style.texture instanceof Function ? style.texture() : style.texture;
        }

        material.needsUpdate = true;

    }, { immediate: true });

    /**
     * Create a canvas texture with hazard stripes for directional tiles
     * @param {string} direction - The direction symbol
     * @returns {THREE.CanvasTexture}
     */
    function createDirectionalTexture(direction) {
        const canvas = document.createElement('canvas');
        canvas.width = 128;
        canvas.height = 128;
        const ctx = canvas.getContext('2d');

        // Constants
        const size = 128;
        const stripeWidth = 40;
        const borderWidth = size / 2;

        // Draw background
        ctx.fillStyle = '#ffffff'; // white '#87ceeb'; // sky blue
        ctx.fillRect(0, 0, 128, 128);

        // Save context and apply clipping
        ctx.save();
        ctx.beginPath();
        // Determine clip region based on direction
        ctx.rect(
            ['→'].includes(direction) ? size - borderWidth : 0,
            ['↓'].includes(direction) ? size - borderWidth : 0,
            ['←','→'].includes(direction) ? borderWidth : size,
            ['↑','↓'].includes(direction) ? borderWidth : size
        );
        ctx.clip();

        // Draw alternating yellow and black concentric 45° rotated squares
        ctx.save();
        // Move origin to center
        ctx.translate(size / 2, size / 2);
        // Rotate canvas by 45 degrees
        ctx.rotate(Math.PI / 4);
        // Draw concentric squares
        for (let i = size * 1.55; i > size / 4; i -= stripeWidth) {
            ctx.fillStyle = Math.floor(i / stripeWidth) % 2 === 0 ? '#ffffff' : '#0000ff';
            const half = i / 2;
            ctx.fillRect( -half, -half, i, i );
        }
        // Restore after drawing squares
        ctx.restore();

        return new THREE.CanvasTexture(canvas);
    }

    /**
     * Create a canvas texture for crate spawner tiles
     * @returns {THREE.CanvasTexture}
     */
    function createCrateSpawnerTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 128;
        canvas.height = 128;

        const ctx = canvas.getContext('2d');

        ctx.fillStyle = '#ffff00';
        ctx.fillRect(0, 0, 128, 128);

        ctx.fillStyle = 'black';
        ctx.font = 'bold 80px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('C', 64, 64);

        return new THREE.CanvasTexture(canvas);
    }

    

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