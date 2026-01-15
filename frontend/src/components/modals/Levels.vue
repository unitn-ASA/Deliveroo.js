<script setup>

    import { ref, inject } from 'vue'
    import { connection } from '@/states/myConnection.js';
    import LevelCard from './LevelCard.vue';

    // @ts-ignore
    var HOST = import.meta.env.VITE_SOCKET_IO_HOST || window.location.origin;

    /** @type {import('vue').Ref<import('@unitn-asa/deliveroo-js-sdk/client').IOGameOptions[]>} */
    const levels = ref([]);

    const selectedLevel = defineModel(); // v-model for the selected level

    fetch(HOST + "/api/games")
    .then( res => res.json() )
    .then( data => {
        levels.value = data;
    })

    function exportMap() {
        const grid = connection.grid;
        const WIDTH = Array.from(grid.tiles.values()).reduce( (max, tile) => Math.max(max, tile.x), 0 ) + 1;
        const HEIGHT = Array.from(grid.tiles.values()).reduce( (max, tile) => Math.max(max, tile.y), 0 ) + 1;
        // const WIDTH = grid.width;
        // const HEIGHT = grid.height;
        const tiles = grid.tiles;
        const map = [];
        for ( let x=0; x<WIDTH; x++ ) {
            const row = []
            for ( let y=0; y<HEIGHT; y++ ) {
                if ( tiles.has(x + y*1000) ) {
                    let tile = tiles.get( x + y*1000 );
                    row.push(tile.type);
                }
                else {
                    row.push(0);
                }
            }
            map.push(row);
        }
        var string = "[\n";
        string += map.map( row => '\t[' + row.join(', ') + ']' ).join( ',\n' )
        // for (const row of map) {
        //     string += '\t[' + row.join(', ') + '],\n';
        // }
        string += "\n]";
        console.log( string );
        // copy into clipboard
        navigator.clipboard.writeText( string );
        alert( "Map copied to clipboard!" );
        return map;
    }

</script>

<template>
    <main class="p-4">
        <div class="w-full mx-auto pb-10">
            <!-- Header with Export Button -->
            <div class="flex justify-between items-center mb-6 px-2">
                <h2 class="text-xl font-bold">Select a Game</h2>
                <button class="btn btn-info btn-sm" @click="exportMap()">
                    Export Map
                </button>
            </div>

            <!-- Levels Grid -->
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                <!-- <LevelCard
                    v-model="connection.configs.GAME"
                /> -->
                <LevelCard
                    v-for="level of levels"
                    :key="level.title"
                    v-model="levels[levels.indexOf(level)]"
                />
            </div>
        </div>
    </main>
</template>

<style scoped>
</style>