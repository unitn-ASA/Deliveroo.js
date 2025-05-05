<script setup>

    import { ref, inject } from 'vue'
    import { patchConfig } from '../../apiClient.js';
    import { connection } from '@/states/myConnection.js';

    var HOST = import.meta.env.VITE_SOCKET_IO_HOST || window.location.origin;

    const emit = defineEmits(['loadMap']); // Define the emit for login

    const maps = ref([]);

    fetch(HOST + "/api/maps")
    .then( res => res.json() )
    .then( data => {
        maps.value = data;
    })

    function loadMap( map ) {
        patchConfig( connection.token, { 'MAP_FILE': map.name[0] } );
        emit('loadMap', map );
    }

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
    <main>

    <div class="w-6/8 mx-auto pb-10 space-y-4">
        
        <div class="flex flex-wrap justify-center p-2">
            <button class="btn btn-info btn-sm" @click="exportMap()">
                Export Map
            </button>
        </div>
        
        <div class="flex flex-wrap justify-center">

            <div class="bg-black bg-opacity-25 box-border p-2 m-2 backdrop-blur-md rounded-xl break-inside-avoid"
                v-for="map of maps">
                
                <button class="btn btn-info btn-sm" @click="loadMap(map)">
                    Load Map <span>{{ map.name[0] }}</span>
                </button>
                {{ map.map[0].length }}x{{ map.map.length }}
                
                <img :src="HOST+map.png" class="mt-2"/>
                
            </div>

        </div>
    
    </div>

    </main>
</template>

<style scoped>
</style>