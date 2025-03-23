<script setup>

    import { ref, inject } from 'vue'
    import { patchConfig } from '../../apiClient.js';
    import { connection } from '@/states/myConnection.js';

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

    <span>

        <div class="flex flex-row my-3" >
            <div class="w-1/3 my-auto" >
                A parcel is generated every
            </div>
            <span class="w-1/6 my-auto text-lg">
                {{ connection.configs.PARCELS_GENERATION_INTERVAL }}
            </span>
            <div class="w-1/2">
                <input type="range" min="0" max="4" v-model="connection.configs.PARCELS_GENERATION_INTERVAL" step="" class="range range-xs range-info" />
                <div class="flex w-full justify-between px-2 text-xs">
                    <span class="w-0">|frame</span>
                    <span class="w-0">|1s</span>
                    <span class="w-0">|2s</span>
                    <span class="w-0">|5s</span>
                    <span class="w-0">|10s</span>
                </div>
            </div>
        </div>
        
        <div class="flex flex-row my-3" >
            <div class="w-1/3 my-auto" >
                With a maximum number of parcels of
            </div>
            <span class="w-1/6 my-auto text-lg">
                {{ connection.configs.PARCELS_MAX }}
            </span>
            <div class="w-1/2">
                <input type="range" min="0" max="400" v-model="connection.configs.PARCELS_MAX" step="" class="range range-xs range-info" />
                <div class="flex w-full justify-between px-2 text-xs">
                    <span class="w-0">|0</span>
                    <span class="w-0">|100</span>
                    <span class="w-0">|200</span>
                    <span class="w-0">|300</span>
                    <span class="w-0">|400</span>
                </div>
            </div>
        </div>

        <div class="flex flex-row my-3" >
            <div class="w-1/2 my-auto" >
                PARCEL_REWARD_AVG: {{ connection.configs.PARCEL_REWARD_AVG }}
            </div>
            <div class="w-1/2">
                <input type="range" min="0" max="400" v-model="connection.configs.PARCEL_REWARD_AVG" step="" class="range range-xs range-info" />
                <div class="flex w-full justify-between px-2 text-xs">
                    <span class="w-0">|0</span>
                    <span class="w-0">|100</span>
                    <span class="w-0">|200</span>
                    <span class="w-0">|300</span>
                    <span class="w-0">|400</span>
                </div>
            </div>
        </div>

        <div class="flex flex-row my-3" >
            <div class="w-1/2 my-auto" >
                PARCEL_REWARD_VARIANCE: {{ connection.configs.PARCEL_REWARD_VARIANCE }}
            </div>
            <div class="w-1/2">
                <input type="range" min="0" max="400" v-model="connection.configs.PARCEL_REWARD_VARIANCE" step="" class="range range-xs range-info" />
                <div class="flex w-full justify-between px-2 text-xs">
                    <span class="w-0">|0</span>
                    <span class="w-0">|100</span>
                    <span class="w-0">|200</span>
                    <span class="w-0">|300</span>
                    <span class="w-0">|400</span>
                </div>
            </div>
        </div>

        <div class="flex flex-row my-3" >
            <div class="w-1/2 my-auto" >
                PARCEL_DECADING_INTERVAL: {{ connection.configs.PARCEL_DECADING_INTERVAL }}
            </div>
            <div class="w-1/2">
                <input type="range" min="0" max="4" v-model="connection.configs.PARCEL_DECADING_INTERVAL" step="" class="range range-xs range-info" />
                <div class="flex w-full justify-between px-2 text-xs">
                    <span class="w-0">|1s</span>
                    <span class="w-0">|2s</span>
                    <span class="w-0">|5s</span>
                    <span class="w-0">|10s</span>
                    <span class="w-0">|infinite</span>
                </div>
            </div>
        </div>

    </span>

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