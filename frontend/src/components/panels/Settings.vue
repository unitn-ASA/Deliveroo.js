<script setup>

    import { ref, inject } from 'vue'
    import { patchConfig } from '../../apiClient.js';
    import { connection } from '@/states/myConnection.js';

    const inputFocused = ref();
    
    function setConfig(key, value) {
        patchConfig( connection.token, key, value );
        inputFocused.value = undefined;
    }

</script>

<template>
    <main>

    <div class="mx-auto space-y-1">
        
        <div class="flex flex-col space-y-1">

            <div class="items-center space-x-1 flex justify-between text-xs"
            v-for="[key, value] of Object.entries(connection.configs)">
                <span class="flex-none inline-block align-middle">{{ key }}</span>
                <input 
                    class="grow input input-ghost btn-xs text-right" 
                    size="2" 
                    v-model="connection.configs[key]" 
                    type="text" 
                    placeholder="Name"
                    @focus="inputFocused = key"
                    @blur=""
                >
                <button 
                    v-show="inputFocused == key" 
                    class="flex-none btn btn-outline btn-error btn-xs" 
                    @click="setConfig(key, value)"
                >
                    Set
                </button>
            </div>

        </div>
    
    </div>

    </main>
</template>

<style scoped>
</style>