<script setup>
        
        import { watchEffect, ref, computed, onMounted } from 'vue';
    import { saveRound } from '@/states/myTournament';
    import { connection } from '../../states/myConnection.js';
    
    function restartGame() {
        connection.socket.emit('restart');
    }
    
    const timer = ref(1000*60*3); // 3min

    const remainingSeconds = (value) => Math.floor((value / 1000) % 60);
    const remainingMinutes = (value) => Math.floor((value / 60000) % 60);
    
    const seconds = computed(() => remainingSeconds(timer.value));
    const minutes = computed(() => remainingMinutes(timer.value));

    var interval;
    
    function start() {
        restartGame();
        interval = setInterval(() => {
            if (timer.value <= 0) {
                saveRound();
                clear();
            }
            else {
                timer.value -= 1000;
            }
        }, 1000);
    }

    function clear() {
        clearInterval(interval);
        interval = null;
        timer.value = 1000*60*3; // 3min
    }
    
</script>

<template>
    <main>

        <div class="grid grid-flow-col gap-2 text-center">

            <button v-if="!interval" class="btn btn-success btn-sm" @click="start">
                <svg class="w-6 h-6 text-black" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
                    <path fill-rule="evenodd" d="M8.6 5.2A1 1 0 0 0 7 6v12a1 1 0 0 0 1.6.8l8-6a1 1 0 0 0 0-1.6l-8-6Z" clip-rule="evenodd"/>
                </svg>
            </button>

            <button v-if="interval" class="btn btn-error btn-sm" @click="clear">
                <svg class="w-6 h-6 text-black" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M7 5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H7Z"/>
                </svg>
            </button>
            
            <button class="btn btn-info btn-sm" @click="timer-=1000*30">
                -
            </button>

            <div class="bg-neutral rounded-lg text-neutral-content py-1">
                <span class="countdown font-mono text-lg mx-auto">
                    <span :style="`--value: ${minutes};`"></span>
                    :
                    <span :style="`--value: ${seconds};`"></span>
                </span>
            </div>
            
            <button class="btn btn-info btn-sm" @click="timer+=1000*30">
                +
            </button>

        </div>

    </main>
</template>

<style>
</style>