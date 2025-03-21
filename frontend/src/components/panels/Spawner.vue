<script setup>
    
    import { ref, computed } from 'vue';
    import { connection } from '../../states/myConnection.js';

    const grid = connection?.grid;

</script>

<template>
    <main>

        <span>
            <div class="my-2">
                PARCELS_GENERATION_INTERVAL: {{ connection.configs.PARCELS_GENERATION_INTERVAL }}
                <input type="range" min="0" max="100" value="25" step="25" class="range range-xs range-info" />
                <div class="flex w-full justify-between px-2 text-xs max-w-xs">
                    <span class="w-3">frame ({{ connection.configs.CLOCK }}ms)</span>
                    <span>1s</span>
                    <span>2s</span>
                    <span>5s</span>
                    <span>10s</span>
                </div>
            </div>
            <div class="my-3">
                PARCELS_MAX: {{ connection.configs.PARCELS_MAX }}
                <input type="range" min="0" max="500" v-model="connection.configs.PARCELS_MAX" class="range range-xs range-info" />
            </div>
            <div class="my-3">
                PARCEL_REWARD_AVG: {{ connection.configs.PARCEL_REWARD_AVG }}
                <input type="range" min="0" max="500" v-model="connection.configs.PARCEL_REWARD_AVG" class="range range-xs range-info" />
            </div>
            <div class="my-3">
                PARCEL_REWARD_VARIANCE: {{ connection.configs.PARCEL_REWARD_VARIANCE }}
                <input type="range" min="0" max="500" v-model="connection.configs.PARCEL_REWARD_VARIANCE" class="range range-xs range-info" />
            </div>
            <div class="my-3">
                PARCEL_DECADING_INTERVAL: {{ connection.configs.PARCEL_DECADING_INTERVAL }}
                <input type="range" min="0" max="4" v-model="connection.configs.PARCEL_DECADING_INTERVAL" step="" class="range range-xs range-info" />
                <div class="flex w-full justify-between px-2 text-xs max-w-xs">
                    <span>1s</span>
                    <span>2s</span>
                    <span>5s</span>
                    <span>10s</span>
                    <span class="w-5">infinite</span>
                </div>
            </div>
        </span>

    </main>
</template>

<style>
</style>