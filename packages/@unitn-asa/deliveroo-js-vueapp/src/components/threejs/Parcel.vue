<script setup>
    import { onMounted, onUnmounted, watch, inject, ref, useTemplateRef } from 'vue';
    import * as THREE from 'three';
    import { CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer.js';

    const props = defineProps({
        id: String,
        x: Number,
        y: Number,
        z: Number,
        color: Number,
        label: Number
    });

    const labelContainer = useTemplateRef("labelContainer");
    
    /** @type {THREE.Mesh} */
    var mesh;

    /** @type {CSS2DObject} */
    var label;

    const scene = inject('scene');
    const camera = inject('camera');

    onMounted(() => {

        // Crea il cubo
        const geometry = new THREE.BoxGeometry( 0.5, 0.5, 0.5 );
        var color = new THREE.Color( 0xffffff );
        color.setHex( Math.random() * 0xffffff );
        const material = new THREE.MeshBasicMaterial( { color, transparent: true, opacity: 1 } );
        mesh = new THREE.Mesh( geometry, material );
        mesh.position.set(props.x, props.y, props.z);
        scene.add(mesh);

        // Aggiungi un'etichetta CSS2DObject
        label = new CSS2DObject(labelContainer.value);
        label.position.set(0, 1, 0);
        if (props.label) mesh.add(label);

        // Watch per monitorare le modifiche alle proprietà
        watch(() => [props.x, props.y, props.z], ([newX, newY, newZ]) => {
            animatePosition(mesh, newX, newY, newZ);
        });
    });

    onUnmounted(() => {
        // Rimuovi il cubo dalla scena
        mesh.remove(label);
        scene.remove(mesh);
        mesh.geometry.dispose();

        // delete html from dom
        // labelRef.value.remove();
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
        <div ref="labelContainer" class="label">{{ props.label }}</div>
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