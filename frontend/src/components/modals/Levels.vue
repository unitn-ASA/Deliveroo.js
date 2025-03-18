<script setup>

    import { ref, inject } from 'vue'
    import { patchConfig } from '../../apiClient.js';
    import { connection } from '@/states/myConnection.js';

    var HOST = import.meta.env.VITE_SOCKET_IO_HOST || window.location.origin;

    const emit = defineEmits(['loadLevel']); // Define the emit for login

    const levels = ref([]);

    fetch(HOST + "/api/levels")
    .then( res => res.json() )
    .then( data => {
        levels.value = data;
    })

    function loadLevel( level ) {
        for ( let [key, value] of Object.entries(level) ) {
            patchConfig( connection.token, key, value );
        }
        emit('loadLevel', level );
    }

</script>

<template>
    <main>

    <div class="w-6/8 mx-auto pb-10 space-y-4">
        
        <div class="flex flex-wrap justify-center">

            <div class="bg-black bg-opacity-25 box-border p-2 m-2 backdrop-blur-md rounded-xl break-inside-avoid"
                v-for="level of levels">
                
                <button class="btn btn-info btn-sm" @click="loadLevel(level)">
                    Load Level <span>{{ level.self }}</span>
                </button>

                <div class="items-center space-x-1 flex justify-between text-xs"
                v-for="[key, value] of Object.entries(level)">
                    <span class="flex-none inline-block align-middle">{{ key }}</span>
                    <!-- non editable input -->
                    <input 
                        class="grow input input-ghost btn-xs text-right" 
                        size="3"
                        v-model="level[key]" 
                        type="text"
                        readonly
                    >
                </div>
                
                <img :src="HOST+'/api/maps/'+level.MAP_FILE+'.png'" class="mt-2"/>
                
            </div>

        </div>
    
    </div>

    </main>
</template>

<style scoped>
</style>