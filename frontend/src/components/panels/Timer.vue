<script setup>
        
    import { computed } from 'vue';
    import { connection } from '../../states/myConnection.js';

    const info = connection?.grid?.info;

    // Funzioni di utilità per ottenere i valori rimanenti
    const remainingMilliseconds = (value) => Math.floor((value / 1) % 1000);
    const remainingSeconds = (value) => Math.floor((value / 1000) % 60);
    const remainingMinutes = (value) => Math.floor((value / 60000) % 60);
    const remainingHours = (value) => Math.floor((value / 3600000) % 24);
    const remainingDays = (value) => Math.floor(value / 86400000);

    // Proprietà calcolate per i valori convertiti
    const milliseconds = computed(() => remainingMilliseconds(info.value.ms));
    const seconds = computed(() => remainingSeconds(info.value.ms));
    const minutes = computed(() => remainingMinutes(info.value.ms));
    const hours = computed(() => remainingHours(info.value.ms));
    const days = computed(() => remainingDays(info.value.ms));

</script>

<template>
    <main v-if="connection?.grid?.info?.value?.ms">
        <div class="grid grid-flow-col gap-2 text-center text-xs">
            <div class="bg-neutral rounded-lg text-neutral-content flex flex-col pt-1">
                <span class="countdown font-mono text-lg mx-auto">
                    <span :style="`--value: ${days};`"></span>
                </span>
                days
            </div>
            <div class="bg-neutral rounded-lg text-neutral-content flex flex-col pt-1">
                <span class="countdown font-mono text-lg mx-auto">
                    <span :style="`--value: ${hours};`"></span>
                </span>
                hours
            </div>
            <div class="bg-neutral rounded-lg text-neutral-content flex flex-col pt-1">
                <span class="countdown font-mono text-lg mx-auto">
                    <span :style="`--value: ${minutes};`"></span>
                </span>
                min
            </div>
            <div class="bg-neutral rounded-lg text-neutral-content flex flex-col pt-1">
                <span class="countdown font-mono text-lg mx-auto">
                    <span :style="`--value: ${seconds};`"></span>
                </span>
                    sec
            </div>
            <div class="bg-neutral rounded-lg text-neutral-content text-center flex flex-col pt-1">
                <span class="countdown font-mono text-lg mx-auto">
                    {{ milliseconds }}
                </span>
                    ms
            </div>
            <div class="bg-neutral rounded-lg text-neutral-content text-center flex flex-col pt-1">
                <span class="countdown font-mono text-lg mx-auto">
                    {{ info.frame }}
                </span>
                frames
            </div>
            <div class="bg-neutral rounded-lg text-neutral-content text-center flex flex-col pt-1">
                <span class="countdown font-mono text-lg mx-auto">
                    {{ Math.round(info.fps) }}
                </span>
                fps
            </div>
            <div class="bg-neutral rounded-lg text-neutral-content text-center flex flex-col pt-1">
                <span class="countdown font-mono text-lg mx-auto">
                    {{ info.heapUsed }}
                </span>
                MB
            </div>
        </div>
    </main>
</template>

<style>
</style>