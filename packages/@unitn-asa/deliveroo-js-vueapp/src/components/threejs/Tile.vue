<script setup>
    import { onMounted, onUnmounted, watch, computed, inject, useTemplateRef } from 'vue';
    import * as THREE from 'three';
    import { CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer.js';

    /**
     * @typedef TileT
     * @type {{
     *         x: number, y: number,
     *         score?: number,
     *         mesh?: THREE.Mesh }}
     */

    // const props = defineProps({
    //     id: Number,
    //     x: Number,
    //     y: Number,
    //     z: Number,
    //     color: Number,
    //     label: String
    // });
    
    /** @type {{tile?:TileT}} */
    const props = defineProps(['tile']);
    
    /** @type {TileT} */
    const tile = props.tile;

    /** @type {import('vue').ComputedRef<string>} */
    const labelText = computed(() => tile.score);

    const labelContainer = useTemplateRef("labelContainer");
    let mesh;

    const scene = inject('scene');
    const camera = inject('camera');

    onMounted(() => {

        // Crea il cubo
        const geometry = new THREE.BoxGeometry( 1, 0.1, 1 );
        const color = ! tile.type ? 0xff0000 : 0x00ff00;
        const material = new THREE.MeshBasicMaterial( { color, transparent: true, opacity: 1 } );
        mesh = new THREE.Mesh(geometry, material);
        mesh.position.set( tile.x * 1.5, 0, - tile.y * 1.5 );
        scene.add(mesh);
        tile.mesh = mesh;

        // Aggiungi un'etichetta CSS2DObject
        const label = new CSS2DObject(labelContainer.value);
        label.position.set(0, 1, 0);
        if (labelText.value) mesh.add(label);

        // Watch per monitorare le modifiche alle proprietà
        watch(() => [tile.x, tile.y, tile.z], ([newX, newY, newZ]) => {
            animatePosition(mesh, newX, newY, newZ);
        });
    });

    onUnmounted(() => {
        // Rimuovi il cubo dalla scena
        scene.remove(mesh);
    });

    // Funzione per animare la posizione del cubo
    const animatePosition = (mesh, x, y, z) => {
        const duration = 1000; // Durata dell'animazione in millisecondi
        const start = { x: mesh.position.x, y: mesh.position.y, z: mesh.position.z };
        const end = { x, y, z };
        const startTime = performance.now();

        const animate = (time) => {
        const elapsed = time - startTime;
        const t = Math.min(elapsed / duration, 1);

        mesh.position.x = start.x + (end.x - start.x) * t;
        mesh.position.y = start.y + (end.y - start.y) * t;
        mesh.position.z = start.z + (end.z - start.z) * t;

        if (t < 1) {
            requestAnimationFrame(animate);
        }
        };

        requestAnimationFrame(animate);
    };
</script>

<template>
    <div>
        <div ref="labelContainer" class="label">{{ labelText }}</div>
    </div>
</template>
  
<style scoped>
/* .label {
    color: white;
    font-family: sans-serif;
    font-size: 12px;
    background: rgba(0, 0, 0, 0.5);
    padding: 2px;
    border-radius: 3px;
} */
</style>