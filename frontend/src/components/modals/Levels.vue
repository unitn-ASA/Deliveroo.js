<script setup>

    import { ref, inject } from 'vue'
    import { connection } from '@/states/myConnection.js';
    import api from '../../utils/api.js';

    var HOST = import.meta.env.VITE_SOCKET_IO_HOST || window.location.origin;

    const emit = defineEmits(['loadLevel']); // Define the emit for login

    const levels = ref([]);

    fetch(HOST + "/api/games")
    .then( res => res.json() )
    .then( data => {
        levels.value = data;
    })

    function loadLevel( level ) {
        api.patchConfig( connection.token, { GAME: level} );
        emit('loadLevel', level );
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

    <div class="w-full mx-auto pb-10 space-y-4">
        
        <div class="flex flex-wrap justify-center p-2">
            <button class="btn btn-info btn-sm" @click="exportMap()">
                Export Map
            </button>
        </div>
        
        <div class="flex flex-wrap justify-center">

            <div class="bg-black bg-opacity-25 box-border p-2 m-2 backdrop-blur-md rounded-xl break-inside-avoid"
                v-for="level of levels">
                
                <button class="btn btn-info btn-sm" @click="loadLevel(level)">
                    Load Level <span>{{ level.title }}</span>
                </button>

                <div class="items-center space-x-1 flex justify-between text-xs"
                v-for="[key, value] of Object.entries(level)">
                    <span class="flex-none inline-block align-middle">{{ key }}</span>
                    <!-- non editable input, level[key] could be an object -->
                    <input 
                        class="grow input input-ghost btn-xs text-right" 
                        size="3"
                        v-model="level[key]" 
                        type="text"
                        readonly
                    >
                </div>
                
                <img v-if="level.title" :src="HOST+level.self+'.png'" class="mt-2"/>
                
            </div>

        </div>
    
    </div>

    </main>
</template>

<style scoped>
</style>