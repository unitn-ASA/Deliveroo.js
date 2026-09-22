<script setup>

    import { onMounted, onUnmounted, ref, computed, watch, reactive, provide, inject } from 'vue';
    import ThreeScene from './ThreeScene.vue';
    import Tile from './Tile.vue';
    import Agent from './Agent.vue';
    import Parcel from './Parcel.vue';
    import Crate from './Crate.vue';
    import Battery from './Battery.vue';
    import Key from './Key.vue';
    import Laser from './Laser.vue';
    import { connection } from '@/states/myConnection.js';
	import { Controller } from '@/utils/Controller.js'

    const tiles = computed ( () => connection.grid.tiles );
    const agents = computed ( () => connection.grid.agents );
    const parcels = computed ( () => connection.grid.parcels );
    const crates = computed ( () => connection.grid.crates );
    // Generic entities rendered by kind through dedicated components
    const batteries = computed ( () => Array.from(connection.grid.entities.values()).filter( entity => entity.kind === 'battery' ) );
    const keys = computed ( () => Array.from(connection.grid.entities.values()).filter( entity => entity.kind === 'key' ) );
    const lasers = computed ( () => Array.from(connection.grid.entities.values()).filter( entity => entity.kind === 'laser' ) );

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

    onUnmounted(() => {
        // console.log('Deliveroojs.vue onUnmounted()')
    })

</script>

<template>
    <main>
        <ThreeScene class="fixed">
            <Tile v-for="[key, t] in tiles.entries()" :key="key" :id="key" :tile="t" />
            <template v-for="[key, a] in agents.entries()" :key="key" :id="key" :agent="a">
                <Agent :agent="a" v-if="a.x !== undefined && a.y !== undefined" />
            </template>
            <Parcel v-for="[key, p] in parcels.entries()" :key="key" :id="key" :parcel="p" />
            <Crate v-for="[key, c] in crates.entries()" :key="key" :id="key" :crate="c" />
            <Battery v-for="b in batteries" :key="b.id" :id="b.id" :battery="b" />
            <Key v-for="k in keys" :key="k.id" :id="k.id" :keyObj="k" />
            <Laser v-for="l in lasers" :key="l.id" :id="l.id" :laser="l" />
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
