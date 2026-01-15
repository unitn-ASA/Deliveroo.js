<script setup>

import { ref, reactive, computed, watch, h } from 'vue'
import { connection } from '@/states/myConnection.js';
import api from '../../utils/api.js';
import { defineComponent } from 'vue';
import LevelCard from './LevelCard.vue';
import GameOptionsJsonEditor from './GameOptionsJsonEditor.vue';

const admin = computed(() => connection?.payload?.role == 'admin');

/** @type {import('vue').Ref< import('@unitn-asa/deliveroo-js-sdk/client').IOGameOptions & { self?: string, png?: string } >} */
const GAME = ref( connection?.configs?.GAME || {} );

watch(() => connection?.configs?.GAME, () => {
    if( connection?.configs?.GAME )
        GAME.value = connection.configs.GAME;
}, { immediate: true });

function loadGame() {
    if (!admin.value) return;
    // send GAME config to server using the parsed (and normalized) object
    api.patchConfig(connection.token, { GAME: GAME.value });
}

</script>

<template>
<main class="rounded-lg bg-slate-600" >
    
    <div class="rounded-lg bg-slate-500 grid grid-flow-col p-2" >
        <h2 class="text-md text-black">
            Game Options
        </h2>
    </div>

    <div class="space-y-4 p-4" >

        <div class="flex flex-wrap gap-4">

            <!-- JSON editor -->
            <div class="grow w-80">
                <GameOptionsJsonEditor
                    v-model="GAME"
                />
            </div>

            <!-- Level card -->
            <div class="flex-1 min-w-50">
                <LevelCard
                    v-model="GAME"
                />
            </div>

        </div>

    </div>

</main>
</template>

<style scoped>
</style>