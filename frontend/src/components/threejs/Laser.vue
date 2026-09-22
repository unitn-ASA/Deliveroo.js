<script setup>
    import { onMounted, onUnmounted, watch, inject } from 'vue';
    import * as THREE from 'three';
	import { connection } from '@/states/myConnection.js';

    /**
      * @typedef Laser
      * @type {import("@/Grid").UIEntity}
     */

    /** @type {{laser?:Laser}} */
    const props = defineProps(['laser']);

    /** @type {Laser} */
    const laser = props.laser;

    /** @type {THREE.Mesh} */
    var mesh;

    /** @type {THREE.MeshStandardMaterial} */
    var material;

    /** @type {THREE.Scene} */
    const scene = inject('scene');

    // Facing yaw of the beam, same convention as the rotation-mode agent:
    // 0 = up (-z), 1 = right (+x), 2 = down (+z), 3 = left (-x)
    const directionOf = () => laser.attributes?.find( ( attribute ) => attribute.kind === 'direction' )?.value ?? 'up';
    const YAW = { up: 0, right: - Math.PI / 2, down: Math.PI, left: Math.PI / 2 };

    onMounted(() => {
        // Laser segment: flat glowing bar along the movement axis.
        // The long side is baked along -z (map 'up'), so the same yaw map as
        // the rotation-mode agent aligns every segment with the beam.
        mesh = new THREE.Mesh();
        const geometry = new THREE.BoxGeometry( 1.5, 0.08, 0.35 );
        geometry.rotateY( Math.PI / 2 );
        material = new THREE.MeshStandardMaterial( {
            color: 0xef4444,        // red
            emissive: 0xff4d4d,
            emissiveIntensity: 1.2,
            roughness: 0.3,
            metalness: 0.1,
            transparent: true,
            opacity: 0.9
        } );
        mesh.geometry = geometry;
        mesh.material = material;
        laser.mesh = mesh;
        placeOnScene();
    });

    onUnmounted(() => {
        scene.remove(mesh);
        mesh.geometry.dispose();
        material?.dispose();
    });

    watch(directionOf, () => {
        placeOnScene();
    });

    watch(() => [laser.x, laser.y], () => {
        placeOnScene();
    });

    watch(() => connection.grid.entities.size, () => {
        placeOnScene();
    });

    function placeOnScene() {
        scene.add(mesh);
        mesh.position.x = laser.x * 1.5;
        mesh.position.y = 0.5;
        mesh.position.z = -laser.y * 1.5;
        mesh.rotation.y = YAW[directionOf()] ?? 0;
    }

</script>

<template>
</template>

<style scoped>
</style>
