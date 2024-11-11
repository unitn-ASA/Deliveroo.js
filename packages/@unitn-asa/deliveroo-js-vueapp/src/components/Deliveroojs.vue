<script setup>

    import { onMounted, onUnmounted, ref, computed, watch, reactive, provide, inject } from 'vue';
    import ThreeScene from './threejs/ThreeScene.vue';
    import Tile from './threejs/Tile.vue';
    import Agent from './threejs/Agent.vue';
    import Parcel from './threejs/Parcel.vue';
    
    const refConnection = inject( "connection" );
    /** @type {import("@/Connection").Connection} */
    const connection = refConnection.value;
    const tiles = connection.grid.tiles;
    const agents = connection.grid.agents;
    const parcels = connection.grid.parcels;
     // me needs to be computed because me is initially a ref('') then reassigned to an Agent!
    const me = computed ( () => connection.grid.me );

    const myMesh = ref(null);
    // const myMesh = computed( () => connection.grid?.me.value?.mesh );

	// watch( () => connection.grid.me, (newVal) => {
	// 	console.log( 'Deliveroojs.vue watch me', newVal.id );
    //     // myMesh.value = newVal.mesh;
	// 	watch ( () => newVal.mesh, (newVal) => {
    //         console.log( 'Deliveroojs.vue watch mesh', newVal );
    //         myMesh.value = newVal;
    //     })
	// });

    watch ( () => connection.grid.me?.mesh, (newVal) => {
        console.log( 'Deliveroojs.vue watch connection.grid.me.mesh', connection.grid.me, me.value );
        myMesh.value = newVal;
    })
    
    onMounted(() => {
        console.log('Deliveroojs.vue onMounted() Using token:', connection?.token);
    })

    onUnmounted(() => {
        console.log('Deliveroojs.vue onUnmounted()')
    })

</script>

<template>
    <main>
        <ThreeScene v-model="myMesh" class="fixed">
            <Tile v-for="[key, t] in tiles.entries()" :key="key" :id="key" :tile="t" :me="me" :connection="connection"/>
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