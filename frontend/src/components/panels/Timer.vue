<script setup>
        
    import { watchEffect, computed, onMounted } from 'vue';

    const { timer, frames } = defineProps(['timer', 'frames']);

    // watchEffect( () => {
    //     console.log('timer', timer);
    // });
    
    // const timer = ref(24721000); // ms

    // Funzioni di utilità per ottenere i valori rimanenti
    const remainingSeconds = (value) => Math.floor((value / 1000) % 60);
    const remainingMinutes = (value) => Math.floor((value / 60000) % 60);
    const remainingHours = (value) => Math.floor((value / 3600000) % 24);
    const remainingDays = (value) => Math.floor(value / 86400000);

    // Proprietà calcolate per i valori convertiti
    const seconds = computed(() => remainingSeconds(timer));
    const minutes = computed(() => remainingMinutes(timer));
    const hours = computed(() => remainingHours(timer));
    const days = computed(() => remainingDays(timer));

</script>

<template>
    <main>
        <div class="grid grid-flow-col gap-2 text-center">
            <div class="bg-neutral rounded-box text-neutral-content flex flex-col p-2">
                <span class="countdown font-mono text-xl mx-auto">
                    <span :style="`--value: ${days};`"></span>
                </span>
                days
            </div>
            <div class="bg-neutral rounded-box text-neutral-content flex flex-col p-2">
                <span class="countdown font-mono text-xl mx-auto">
                    <span :style="`--value: ${hours};`"></span>
                </span>
                hours
            </div>
            <div class="bg-neutral rounded-box text-neutral-content flex flex-col p-2">
                <span class="countdown font-mono text-xl mx-auto">
                    <span :style="`--value: ${minutes};`"></span>
                </span>
                min
            </div>
            <div class="bg-neutral rounded-box text-neutral-content flex flex-col p-2">
                <span class="countdown font-mono text-xl mx-auto">
                    <span :style="`--value: ${seconds};`"></span>
                </span>
                sec
            </div>
            <div class="bg-neutral rounded-box text-neutral-content text-center flex flex-col p-2">
                <span class="countdown font-mono text-xl mx-auto">
                    {{ frames }}
                </span>
                frames
            </div>
        </div>
    </main>
</template>

<style>
</style>