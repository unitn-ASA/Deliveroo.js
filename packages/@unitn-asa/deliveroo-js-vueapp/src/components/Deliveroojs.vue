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
            <Tile v-for="[key, t] in tiles.entries()" :key="key" :id="key" :tile="t" />
            <Agent v-for="[key, a] in agents.entries()" :key="key" :id="key" :agent="a" />
            <!-- <Agent v-model="me" :key="me.id" :id="me.id" /> -->
            <Parcel v-for="[key, p] in parcels.entries()" :key="key" :id="key" :x="p.x * 1.5" :y="0.5" :z="-p.y * 1.5" :color="p.color" :label="p.reward" />
        </ThreeScene>
    </main>
</template>

<style>

    .label {
        color: #FFF;
        font-family: sans-serif;
        padding: 2px;
        background: rgba( 0, 0, 0, .6 );
        font-size: '12pt';
    }

</style>