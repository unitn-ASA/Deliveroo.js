<script setup>

    import { ref } from 'vue'
    import { patchConfig } from '../apiClient.js';
    import { settings } from '../states/settings.js';

    const emit = defineEmits(['settings']); // Define the emit for settings
    const inputFocused = ref();

    function setConfig(key, value) {
        patchConfig( key, value );
        emit('settings', { key, value });
    }

</script>

<template>
    <main>

    <div class="mx-auto pb-10 space-y-1">
        
        <div class="flex flex-col space-y-1">

            <div class="items-center space-x-1 flex justify-between text-xs"
            v-for="[key, value] of Object.entries(settings)">
                <span class="flex-none inline-block align-middle">{{ key }}</span>
                <input 
                    class="grow input input-ghost btn-xs text-right" 
                    size="2" 
                    v-model="settings[key]" 
                    type="text" 
                    placeholder="Name"
                    @focus="inputFocused = key"
                    @blur="inputFocused = undefined"
                >
                <button 
                    v-if="inputFocused == key" 
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