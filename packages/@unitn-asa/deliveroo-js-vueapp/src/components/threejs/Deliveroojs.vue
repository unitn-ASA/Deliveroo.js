<script setup>

    import { onMounted, onUnmounted, ref, computed, watch, reactive, provide, inject } from 'vue';
    import ThreeScene from './ThreeScene.vue';
    import Tile from './Tile.vue';
    import Agent from './Agent.vue';
    import Parcel from './Parcel.vue';
    import { connection } from '@/states/myConnection';
	import { Controller } from '@/utils/Controller.js'

    const tiles = computed ( () => connection.grid.tiles );
    const agents = computed ( () => connection.grid.agents );
    const parcels = computed ( () => connection.grid.parcels );

	// watch( () => connection.grid.me, (newVal) => {
	// 	console.log( 'Deliveroojs.vue watch me', newVal.id );
    //     // myMesh.value = newVal.mesh;
	// 	watch ( () => newVal.mesh, (newVal) => {
    //         console.log( 'Deliveroojs.vue watch mesh', newVal );
    //         myMesh.value = newVal;
    //     })
	// });

    // watch ( () => connection.grid.me?.mesh, (newVal) => {
    //     console.log( 'Deliveroojs.vue watch connection.grid.me.mesh', connection.grid.me, me.value );
    //     myMesh.value = newVal;
    // })
    
    onMounted(() => {
        // console.log('Deliveroojs.vue onMounted() Using token:', connection?.token);
		new Controller( connection );
    })

    // onUnmounted(() => {
    //     console.log('Deliveroojs.vue onUnmounted()')
    // })

</script>

<template>
    <main>
        <ThreeScene class="fixed">
            <Tile v-for="[key, t] in tiles.entries()" :key="key" :id="key" :tile="t" />
            <Agent v-for="[key, a] in agents.entries()" :key="key" :id="key" :agent="a" />
            <Parcel v-for="[key, p] in parcels.entries()" :key="key" :id="key" :parcel="p" />
        </ThreeScene>
    </main>
</template>

<style>

    .label {
        color: #FFF;
        font-family: sans-serif;
        font-size: 1rem !important;
        padding: 0px;
        background: rgba( 0, 0, 0, .8 );
    }

</style>