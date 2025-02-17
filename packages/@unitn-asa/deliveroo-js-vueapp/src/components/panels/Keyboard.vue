<script setup>
    
    import { ref, computed, reactive } from 'vue';
    import { keys } from '@/states/keyboard.js';

    function click ( code ) {
        keys[code] = false;
        keys[code] = true;
        setTimeout( () => keys[code] = false );
    }

    function hold ( code ) {
        keys[code] = ! keys[code];
    }

</script>

<template>
    <main class="z-10 grid grid-flow gap-1 text-center">

        <div class="z-10 grid grid-flow-col gap-1">
            <button class="btn btn-outline btn-xs" :class="{'bg-white': keys.Digit1}" @click="keys.Digit1 = ! keys.Digit1">1</button>
            <button class="btn btn-outline btn-xs" :class="{'bg-white': keys.Digit2}" @click="keys.Digit2 = ! keys.Digit2">2</button>
            <button class="btn btn-outline btn-xs" :class="{'bg-white': keys.Digit3}" @click="keys.Digit3 = ! keys.Digit3">3</button>
            <button class="btn btn-outline btn-xs" :class="{'bg-white': keys.Digit4}" @click="keys.Digit4 = ! keys.Digit4">4</button>
            <button class="btn btn-outline btn-xs" :class="{'bg-white': keys.Digit5}" @click="keys.Digit5 = ! keys.Digit5">5</button>
            <span>...</span>
            <button class="btn btn-outline btn-xs" :class="{'bg-white': keys.Digit0}" @click="keys.Digit0 = ! keys.Digit0">0</button>
        </div>
        <div class="z-10 grid grid-flow-col gap-1 mr-10">
            <button class="btn btn-outline btn-sm" :class="{'bg-white': keys.KeyQ}" @click="click('KeyQ')">Q
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="size-5">
                    <path fill-rule="evenodd" d="M13.75 7h-3V3.66l1.95 2.1a.75.75 0 1 0 1.1-1.02l-3.25-3.5a.75.75 0 0 0-1.1 0L6.2 4.74a.75.75 0 0 0 1.1 1.02l1.95-2.1V7h-3A2.25 2.25 0 0 0 4 9.25v7.5A2.25 2.25 0 0 0 6.25 19h7.5A2.25 2.25 0 0 0 16 16.75v-7.5A2.25 2.25 0 0 0 13.75 7Zm-3 0h-1.5v5.25a.75.75 0 0 0 1.5 0V7Z" clip-rule="evenodd" />
                </svg>
            </button>
            <button class="btn btn-outline btn-sm" :class="{'bg-white': keys.KeyW}" @click="click('KeyW')">W ▲</button>
            <button class="btn btn-outline btn-sm" :class="{'bg-white': keys.KeyE}" @click="click('KeyE')">E
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="size-5">
                    <path d="M13.75 7h-3v5.296l1.943-2.048a.75.75 0 0 1 1.114 1.004l-3.25 3.5a.75.75 0 0 1-1.114 0l-3.25-3.5a.75.75 0 1 1 1.114-1.004l1.943 2.048V7h1.5V1.75a.75.75 0 0 0-1.5 0V7h-3A2.25 2.25 0 0 0 4 9.25v7.5A2.25 2.25 0 0 0 6.25 19h7.5A2.25 2.25 0 0 0 16 16.75v-7.5A2.25 2.25 0 0 0 13.75 7Z" />
                </svg>
            </button>
        </div>
        <div class="z-10 grid grid-flow-col gap-1 ml-10">
            <button class="btn btn-outline btn-sm" :class="{'bg-white': keys.KeyA}" @click="click('KeyA')">A ◀︎</button>
            <button class="btn btn-outline btn-sm" :class="{'bg-white': keys.KeyS}" @click="click('KeyS')">S ▼</button>
            <button class="btn btn-outline btn-sm" :class="{'bg-white': keys.KeyD}" @click="click('KeyD')">D ▶︎</button>
        </div>
        <div class="z-10 grid grid-flow-col gap-1">
            <button class="btn btn-outline btn-sm" :class="{'bg-white': keys.ShiftLeft}" @click="hold('ShiftLeft')">Shift</button>
            <button class="btn btn-outline btn-sm" :class="{'bg-white': keys.ControlLeft}" @click="hold('ControlLeft')">Ctrl</button>
            <button class="btn btn-outline btn-sm" :class="{'bg-white': keys.AltLeft}" @click="hold('AltLeft')">Alt</button>
            <button class="btn btn-outline btn-sm px-10" :class="{'bg-white': keys.Space}" @click="click('Space')">Space</button>
        </div>

    </main>
</template>

<style>
</style>