<script setup>
    import { onMounted, onUnmounted, defineModel, ref, inject, computed, useTemplateRef } from 'vue';
    import * as THREE from 'three';
    import { CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer.js';

    /**
     * @typedef AgentT
     * @type {{id: String,
     *         name: String,
     *         teamId: string
     *         teamName: string,
     *         x: number, y: number,
     *         score?: number,
     *         color?: Number,
     *         label?: String,
     *         mesh?: THREE.Mesh }}
     */
    
    // const props = defineProps({
    //     agent: Object,
    //     id: String,
    //     x: Number,
    //     y: Number,
    //     color: Number,
    //     label: String
    // });

    // /** @type {AgentT} */
    // const agent = defineModel();
    
    /** @type {{agent?:AgentT}} */
    const props = defineProps(['agent']);
    
    /** @type {AgentT} */
    const agent = props.agent;

    /** @type {import('vue').ComputedRef<string>} */
    const labelText = computed(() => agent.name);

    const labelContainer = useTemplateRef("labelContainer");

    const scene = inject('scene');
    const camera = inject('camera');

    onMounted(() => {
        // Crea il cubo
        const geometry = new THREE.ConeGeometry( 0.5, 1, 32 );
        const material = new THREE.MeshBasicMaterial( { color: 'white', transparent: true, opacity: 1 } );
        const mesh = new THREE.Mesh( geometry, material );
        mesh.position.set(agent.x*1.5, 0.5, -agent.y*1.5);
        scene.add(mesh);
        agent.mesh = mesh;

        // Aggiungi un'etichetta CSS2DObject
        const label = new CSS2DObject(labelContainer.value);
        label.position.set(0, 1, 0);
        if (labelText.value) mesh.add(label);

        // // Watch per monitorare le modifiche alle proprietà
        // watch(() => [props.x, props.y], ([newX, newY]) => {
        // });
    });

    onUnmounted(() => {
        // Rimuovi il cubo dalla scena
        scene.remove(agent.mesh);
    });

    function animate () {

        let targetVector3 = new THREE.Vector3( Math.round(agent.x) * 1.5, agent.mesh.position.y, - Math.round(agent.y) * 1.5 );

        if ( agent.x == Math.round(agent.x) && agent.y == Math.round(agent.y) ) { // if arrived
            agent.mesh.position.lerp( targetVector3, 0.5 );
        } else { // if still moving
            // targetVector3 = new THREE.Vector3( this.x * 1.5, this.#mesh.position.y, - this.y * 1.5 );
            agent.mesh.position.lerp( targetVector3, 0.08 );
        }

        requestAnimationFrame(animate);

    };

    requestAnimationFrame(animate);
    
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