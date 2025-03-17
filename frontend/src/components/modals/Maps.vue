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
        patchConfig( connection.token, 'MAP_FILE', map.name[0] );
        emit('loadMap', map );
    }

</script>

<template>
    <main>

    <div class="w-6/8 mx-auto pb-10 space-y-4">
        
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