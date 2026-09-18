<script setup>
    import { onMounted, onUnmounted, watch, inject, useTemplateRef } from 'vue';
    import * as THREE from 'three';
	import { connection } from '@/states/myConnection.js';

    /**
      * @typedef Key
       * @type {import("@/Grid").UIEntity}
      */

    /** @type {{keyObj?:Key}} */
    const props = defineProps(['keyObj']);

    /** @type {Key} */
    const key = props.keyObj;

    /** @type {THREE.Mesh} */
    var mesh;

    /** @type {THREE.Scene} */
    const scene = inject('scene');

    onMounted(() => {
        // Create the key as a small torus (the bow) plus we keep a simple box for visibility
        const geometry = new THREE.TorusGeometry(0.25, 0.1, 12, 24);

        const material = new THREE.MeshStandardMaterial({
            color: 0xfacc15, // Gold
            emissive: 0xfde047, // Light gold emissive
            emissiveIntensity: 0.25,
            transparent: true,
            opacity: 1,
            roughness: 0.3,
            metalness: 0.8
        });
        mesh = new THREE.Mesh(geometry, material);
        key.mesh = mesh;
        placeOnScene();
    });

    onUnmounted(() => {
        scene.remove(mesh);
        mesh.geometry.dispose();
    });

    watch(() => key.hoovered, (hovered) => {
        if (hovered) {
            mesh.scale.set(1.2, 1.2, 1.2);
            mesh.material.emissiveIntensity = 0.4;
        } else {
            mesh.scale.set(1, 1, 1);
            mesh.material.emissiveIntensity = 0;
        }
    });

    watch(() => [key.x, key.y], () => {
        placeOnScene();
    });

    watch(() => connection.grid.entities.size, () => {
        placeOnScene();
    });

    function placeOnScene() {
        scene.add(mesh);
        mesh.position.x = key.x * 1.5;
        mesh.position.z = -key.y * 1.5;
        mesh.position.y = 0.5;
        connection.grid.getEntitiesAt(key.x, key.y)
            .filter((entity) => entity.kind === 'key')
            .forEach((k, i) => {
                if (k.mesh) k.mesh.position.y = i * 0.9 + 0.5;
            });
    }

</script>

<template>
</template>

<style scoped>
</style>
