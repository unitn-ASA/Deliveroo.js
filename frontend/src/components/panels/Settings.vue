<script setup>

    import { ref, inject, computed } from 'vue'
    import { patchConfig } from '../../apiClient.js';
    import { connection } from '@/states/myConnection.js';

    const admin = computed(() => {
        return connection?.payload?.role == 'admin';
    });

    const inputFocused = ref();
    
    function setConfig(key, value) {
        let config = {};
        config[key] = value;
        patchConfig( connection.token, config );
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
                    v-bind:disabled="!admin"
                >
                <button 
                    v-show="inputFocused == key" 
                    class="flex-none btn btn-outline btn-error btn-xs" 
                    @click="setConfig(key, value)" v-if="admin"
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