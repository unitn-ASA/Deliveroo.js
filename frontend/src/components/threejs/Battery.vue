<script setup>
    import { onMounted, onUnmounted, watch, inject, useTemplateRef } from 'vue';
    import * as THREE from 'three';
	import { connection } from '@/states/myConnection.js';

    /**
      * @typedef Battery
       * @type {import("@/Grid").UIEntity}
      */

    /** @type {{battery?:Battery}} */
    const props = defineProps(['battery']);

    /** @type {Battery} */
    const battery = props.battery;

    /** @type {THREE.Mesh} */
    var mesh;

    /** @type {THREE.MeshStandardMaterial} */
    var bodyMaterial;

    /** @type {THREE.MeshStandardMaterial} */
    var capMaterial;

    /** @type {THREE.Scene} */
    const scene = inject('scene');

    onMounted(() => {
        // Battery shape: standing green cylinder with a gold positive terminal on top
        mesh = new THREE.Group();

        const bodyGeometry = new THREE.CylinderGeometry( 0.18, 0.18, 0.55, 20 );
        bodyMaterial = new THREE.MeshStandardMaterial( {
            color: 0x22c55e,        // green
            emissive: 0x4ade80,     // light green
            emissiveIntensity: 0,
            roughness: 0.5,
            metalness: 0.2
        } );
        const body = new THREE.Mesh( bodyGeometry, bodyMaterial );
        body.position.y = 0.275;

        const capGeometry = new THREE.CylinderGeometry( 0.07, 0.07, 0.1, 12 );
        capMaterial = new THREE.MeshStandardMaterial( {
            color: 0xfacc15,        // gold
            roughness: 0.3,
            metalness: 0.7
        } );
        const cap = new THREE.Mesh( capGeometry, capMaterial );
        cap.position.y = 0.6;

        mesh.add( body, cap );
        battery.mesh = mesh;
        placeOnScene();
    });

    onUnmounted(() => {
        scene.remove(mesh);
        mesh.children.forEach( (child) => child.geometry.dispose() );
        bodyMaterial?.dispose();
        capMaterial?.dispose();
    });

    watch(() => battery.hoovered, (hovered) => {
        if (hovered) {
            mesh.scale.set(1.2, 1.2, 1.2);
            bodyMaterial.emissiveIntensity = 0.3;
        } else {
            mesh.scale.set(1, 1, 1);
            bodyMaterial.emissiveIntensity = 0;
        }
    });

    watch(() => [battery.x, battery.y], () => {
        placeOnScene();
    });

    watch(() => connection.grid.entities.size, () => {
        placeOnScene();
    });

    function placeOnScene() {
        scene.add(mesh);
        mesh.position.x = battery.x * 1.5;
        mesh.position.z = -battery.y * 1.5;
        connection.grid.getEntitiesAt(battery.x, battery.y)
            .filter((entity) => entity.kind === 'battery')
            .forEach((b, i) => {
                if (b.mesh) b.mesh.position.y = i * 0.9 + 0.5;
            });
    }

</script>

<template>
</template>

<style scoped>
</style>
