<script setup>
    import { onMounted, onUnmounted, watch, inject, computed, useTemplateRef } from 'vue';
    import * as THREE from 'three';
	import { connection } from '@/states/myConnection.js';

    /**
     * @typedef Crate
     * @type {import("@/Grid").UICrate}
     */

    /** @type {{crate?:Crate}} */
    const props = defineProps(['crate']);

    /** @type {Crate} */
    const crate = props.crate;

    /** @type {THREE.Mesh} */
    var mesh;

    /** @type {THREE.Scene} */
    const scene = inject('scene');

    onMounted(() => {
        // Create the crate box (larger than parcel)
        const geometry = new THREE.BoxGeometry(0.7, 0.7, 0.7);

        // Create crate texture with edges drawn on faces
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 256;
        const ctx = canvas.getContext('2d');

        // Fill with lighter base color (light brown/tan)
        ctx.fillStyle = '#C4A484'; // Light wood color
        ctx.fillRect(0, 0, 256, 256);

        // Draw lighter border/edges
        ctx.strokeStyle = '#E8DCC8'; // Very light wood
        ctx.lineWidth = 16;
        ctx.strokeRect(8, 8, 240, 240);

        // Draw cross brace pattern (typical crate look)
        ctx.beginPath();
        // ctx.moveTo(8, 8);
        // ctx.lineTo(248, 248);
        ctx.moveTo(248, 8);
        ctx.lineTo(8, 248);
        ctx.stroke();

        // Draw horizontal brace
        ctx.beginPath();
        ctx.moveTo(8, 128);
        ctx.lineTo(248, 128);
        ctx.stroke();

        // Draw vertical brace
        ctx.beginPath();
        ctx.moveTo(128, 8);
        ctx.lineTo(128, 248);
        ctx.stroke();

        const texture = new THREE.CanvasTexture(canvas);

        const material = new THREE.MeshStandardMaterial({
            color: 0xC4A484, // Light wood color
            map: texture,
            emissive: 0xFFE4B5, // Moccasin/light tan emissive
            emissiveIntensity: 0.2,
            transparent: true,
            opacity: 1,
            roughness: 0.8,
            metalness: 0.1
        });
        mesh = new THREE.Mesh(geometry, material);
        crate.mesh = mesh;
        placeOnScene();
    });

    onUnmounted(() => {
        scene.remove(mesh);
        mesh.geometry.dispose();
    });

    watch(() => crate.hoovered, (hovered) => {
        if (hovered) {
            mesh.scale.set(1.2, 1.2, 1.2);
            mesh.material.emissiveIntensity = 0.3;
        } else {
            mesh.scale.set(1, 1, 1);
            mesh.material.emissiveIntensity = 0;
        }
    });

    watch(() => [crate.x, crate.y], () => {
        placeOnScene();
    });

    watch(() => connection.grid.crates.size, () => {
        placeOnScene();
    });

    function placeOnScene() {
        scene.add(mesh);
        mesh.position.x = crate.x * 1.5;
        mesh.position.z = -crate.y * 1.5;
        connection.grid.getCratesAt(crate.x, crate.y).forEach((c, i) => {
            if (c.mesh) c.mesh.position.y = i * 0.9 + 0.5;
        });
    }

</script>

<template>
</template>

<style scoped>
</style>
