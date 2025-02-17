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
            <button class="btn btn-outline btn-sm" :class="{'bg-white': keys.Digit1}" @click="keys.Digit1 = ! keys.Digit1">1</button>
            <button class="btn btn-outline btn-sm" :class="{'bg-white': keys.Digit2}" @click="keys.Digit2 = ! keys.Digit2">2</button>
            <button class="btn btn-outline btn-sm" :class="{'bg-white': keys.Digit3}" @click="keys.Digit3 = ! keys.Digit3">3</button>
            <button class="btn btn-outline btn-sm" :class="{'bg-white': keys.Digit4}" @click="keys.Digit4 = ! keys.Digit4">4</button>
            <button class="btn btn-outline btn-sm" :class="{'bg-white': keys.Digit5}" @click="keys.Digit5 = ! keys.Digit5">5</button>
            <button class="btn btn-outline btn-sm" :class="{'bg-white': keys.Digit0}" @click="keys.Digit0 = ! keys.Digit0">0</button>
        </div>
        <div class="z-10 grid grid-flow-col gap-1 mr-10">
            <button class="btn btn-outline btn-sm" :class="{'bg-white': keys.KeyQ}" @click="click('KeyQ')">Q pickup</button>
            <button class="btn btn-outline btn-sm" :class="{'bg-white': keys.KeyW}" @click="click('KeyW')">W ▲</button>
            <button class="btn btn-outline btn-sm" :class="{'bg-white': keys.KeyE}" @click="click('KeyE')">E pudown</button>
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
            <button class="btn btn-outline btn-sm" :class="{'bg-white': keys.Space}" @click="click('Space')">Space</button>
        </div>

    </main>
</template>

<style>
</style>