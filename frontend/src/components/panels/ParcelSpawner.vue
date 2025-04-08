<script setup>

    import { ref, computed } from 'vue'
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

    const PARCELS_GENERATION_INTERVAL_index = computed( {
        get: () => {
            if ( connection.configs.PARCELS_GENERATION_INTERVAL == 'frame' ) return 0;
            if ( connection.configs.PARCELS_GENERATION_INTERVAL == '1s' ) return 1;
            if ( connection.configs.PARCELS_GENERATION_INTERVAL == '2s' ) return 2;
            if ( connection.configs.PARCELS_GENERATION_INTERVAL == '5s' ) return 3;
            if ( connection.configs.PARCELS_GENERATION_INTERVAL == '10s' ) return 4;
        },
        set: (value) => {
            if ( value == 0 ) connection.configs.PARCELS_GENERATION_INTERVAL = 'frame';
            if ( value == 1 ) connection.configs.PARCELS_GENERATION_INTERVAL = '1s';
            if ( value == 2 ) connection.configs.PARCELS_GENERATION_INTERVAL = '2s';
            if ( value == 3 ) connection.configs.PARCELS_GENERATION_INTERVAL = '5s';
            if ( value == 4 ) connection.configs.PARCELS_GENERATION_INTERVAL = '10s';
        }
    } );

    const PARCEL_DECADING_INTERVAL_index = computed( {
        get: () => {
            if ( connection.configs.PARCEL_DECADING_INTERVAL == '1s' ) return 0;
            if ( connection.configs.PARCEL_DECADING_INTERVAL == '2s' ) return 1;
            if ( connection.configs.PARCEL_DECADING_INTERVAL == '5s' ) return 2;
            if ( connection.configs.PARCEL_DECADING_INTERVAL == '10s' ) return 3;
            if ( connection.configs.PARCEL_DECADING_INTERVAL == 'infinite' ) return 4;
        },
        set: (value) => {
            if ( value == 0 ) connection.configs.PARCEL_DECADING_INTERVAL = '1s';
            if ( value == 1 ) connection.configs.PARCEL_DECADING_INTERVAL = '2s';
            if ( value == 2 ) connection.configs.PARCEL_DECADING_INTERVAL = '5s';
            if ( value == 3 ) connection.configs.PARCEL_DECADING_INTERVAL = '10s';
            if ( value == 4 ) connection.configs.PARCEL_DECADING_INTERVAL = 'infinite';
        }
    } );

</script>

<template>
<main class="rounded-lg bg-slate-600" >
    
    <div class="rounded-lg bg-slate-500 grid grid-flow-col p-4" >
        <h2 class="text-lg text-black">
            Parcel Spawner
        </h2>
        <button class="btn btn-outline btn-error btn-xs" @click="" disabled>
            Spawn a new parcel
        </button>
    </div>

    <div class="space-y-4 p-4" >
    
        <div class="flex flex-row" >
            <div class="w-1/3 my-auto" >
                PARCELS_GENERATION_INTERVAL
                <br/>
                A parcel is generated every
            </div>
            <span class="w-1/6 my-auto text-lg text-right pr-5">
                <button
                    v-show="inputFocused == 'PARCELS_GENERATION_INTERVAL'" 
                    class="flex-none btn btn-outline btn-error btn-xs ml-5" 
                    @click="setConfig('PARCELS_GENERATION_INTERVAL', connection.configs.PARCELS_GENERATION_INTERVAL)"
                >
                    Set
                </button>
                {{ connection.configs.PARCELS_GENERATION_INTERVAL }}
            </span>
            <div class="w-1/2 pr-5">
                <input
                    type="range" min="0" max="4" step=""
                    v-model="PARCELS_GENERATION_INTERVAL_index"
                    class="range range-xs range-info"
                    @focus="inputFocused = 'PARCELS_GENERATION_INTERVAL'"
                    v-bind:disabled="!admin"
                />
                <div class="flex w-full justify-between px-2 text-xs">
                    <span class="w-0">|frame</span>
                    <span class="w-0">|1s</span>
                    <span class="w-0">|2s</span>
                    <span class="w-0">|5s</span>
                    <span class="w-0">|10s</span>
                </div>
            </div>
        </div>
        
        <div class="flex flex-row" >
            <div class="w-1/3 my-auto" >
                PARCELS_MAX
                <br/>
                Maximum number of parcels
            </div>
            <span class="w-1/6 my-auto text-lg text-right pr-5">
                <button
                    v-show="inputFocused == 'PARCELS_MAX'" 
                    class="flex-none btn btn-outline btn-error btn-xs ml-5" 
                    @click="setConfig('PARCELS_MAX', connection.configs.PARCELS_MAX)"
                >
                    Set
                </button>
                {{ connection.configs.PARCELS_MAX }}
            </span>
            <div class="w-1/2 pr-5">
                <input
                    type="range" min="0" max="200" step=""
                    v-model="connection.configs.PARCELS_MAX"
                    class="range range-xs range-info"
                    @focus="inputFocused = 'PARCELS_MAX'"
                    v-bind:disabled="!admin"
                />
                <div class="flex w-full justify-between px-2 text-xs">
                    <span class="w-0">|0</span>
                    <span class="w-0">|50</span>
                    <span class="w-0">|100</span>
                    <span class="w-0">|150</span>
                    <span class="w-0">|200</span>
                </div>
            </div>
        </div>

        <div class="flex flex-row " >
            <div class="w-1/3 my-auto" >
                PARCEL_REWARD_AVG
                <br/>
                Initial reward per parcel
            </div>
            <span class="w-1/6 my-auto text-lg text-right pr-5">
                <button
                    v-show="inputFocused == 'PARCEL_REWARD_AVG'" 
                    class="flex-none btn btn-outline btn-error btn-xs ml-5" 
                    @click="setConfig('PARCEL_REWARD_AVG', connection.configs.PARCEL_REWARD_AVG)"
                >
                    Set
                </button>
                {{ connection.configs.PARCEL_REWARD_AVG }}
            </span>
            <div class="w-1/2 pr-5">
                <input
                    type="range" min="0" max="200" step=""
                    v-model="connection.configs.PARCEL_REWARD_AVG"
                    class="range range-xs range-info"
                    @focus="inputFocused = 'PARCEL_REWARD_AVG'"
                    v-bind:disabled="!admin"
                />
                <div class="flex w-full justify-between px-2 text-xs">
                    <span class="w-0">|0</span>
                    <span class="w-0">|50</span>
                    <span class="w-0">|100</span>
                    <span class="w-0">|150</span>
                    <span class="w-0">|200</span>
                </div>
            </div>
        </div>

        <div class="flex flex-row " >
            <div class="w-1/3 my-auto" >
                PARCEL_REWARD_VARIANCE
                <br/>
                Initial reward: [avg-var, avg+var] 
            </div>
            <span class="w-1/6 my-auto text-lg text-right pr-5">
                <button
                    v-show="inputFocused == 'PARCEL_REWARD_VARIANCE'" 
                    class="flex-none btn btn-outline btn-error btn-xs ml-5" 
                    @click="setConfig('PARCEL_REWARD_VARIANCE', connection.configs.PARCEL_REWARD_VARIANCE)"
                >
                    Set
                </button>
                {{ connection.configs.PARCEL_REWARD_VARIANCE }}
            </span>
            <div class="w-1/2 pr-5">
                <input
                    type="range" min="0" max="200" step=""
                    v-model="connection.configs.PARCEL_REWARD_VARIANCE"
                    class="range range-xs range-info"
                    @focus="inputFocused = 'PARCEL_REWARD_VARIANCE'"
                    v-bind:disabled="!admin"
                />
                <div class="flex w-full justify-between px-2 text-xs">
                    <span class="w-0">|0</span>
                    <span class="w-0">|50</span>
                    <span class="w-0">|100</span>
                    <span class="w-0">|150</span>
                    <span class="w-0">|200</span>
                </div>
            </div>
        </div>

        <div class="flex flex-row " >
            <div class="w-1/3 my-auto" >
                PARCEL_DECADING_INTERVAL
                <br/>
                Recurrently decreased by 1
            </div>
            <span class="w-1/6 my-auto text-lg text-right pr-5">
                <button
                    v-show="inputFocused == 'PARCEL_DECADING_INTERVAL'" 
                    class="flex-none btn btn-outline btn-error btn-xs ml-5" 
                    @click="setConfig('PARCEL_DECADING_INTERVAL', connection.configs.PARCEL_DECADING_INTERVAL)"
                >
                    Set
                </button>
                {{ connection.configs.PARCEL_DECADING_INTERVAL }}
            </span>
            <div class="w-1/2 pr-5">
                <input
                    type="range" min="0" max="4" step=""
                    v-model="PARCEL_DECADING_INTERVAL_index"
                    class="range range-xs range-info"
                    @focus="inputFocused = 'PARCEL_DECADING_INTERVAL'"
                    v-bind:disabled="!admin"
                />
                <div class="flex w-full justify-between px-2 text-xs">
                    <span class="w-0">|1s</span>
                    <span class="w-0">|2s</span>
                    <span class="w-0">|5s</span>
                    <span class="w-0">|10s</span>
                    <span class="w-0">|infinite</span>
                </div>
            </div>
        </div>
    </div>

</main>
</template>

<style scoped>
</style>