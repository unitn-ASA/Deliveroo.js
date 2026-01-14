<script setup>

import { ref, reactive, computed, watch, h } from 'vue'
import { connection } from '@/states/myConnection.js';
import api from '../../utils/api.js';
import { defineComponent } from 'vue';

const inputFocused = ref();

// JSON editor state
const jsonText = ref('');
const parsed = ref(null);
const validation = reactive({ valid: false, errors: [] });

const admin = computed(() => connection?.payload?.role == 'admin');

watch(() => connection?.configs?.GAME, () => resetFromConnection(), { immediate: true });

// Initialize jsonText from current GAME config if available
function resetFromConnection() {
    try {
        const g = connection?.configs?.GAME || {};
        jsonText.value = JSON.stringify(g, null, 2);
        parseJson();
    } catch (e) {
        jsonText.value = '{}';
        parsed.value = {};
        validation.valid = false;
        validation.errors.length = 0;
    }
}

// Basic validation following IOGameOptions typedef (best-effort)
function validateGameOptions(obj) {
    const errs = [];
    if (!obj || typeof obj !== 'object') {
        errs.push('Root must be an object');
        return errs;
    }
    if (!('title' in obj)) errs.push('Missing property: title');
    else if (typeof obj.title !== 'string') errs.push('title must be a string');

    if ('description' in obj && typeof obj.description !== 'string') errs.push('description must be a string');

    if (!('map' in obj)) errs.push('Missing property: map');
    else if (typeof obj.map !== 'object') errs.push('map must be an object');
    else {
        if (!('width' in obj.map) || typeof obj.map.width !== 'number') errs.push('map.width must be a number');
        if (!('height' in obj.map) || typeof obj.map.height !== 'number') errs.push('map.height must be a number');
        if (!('tiles' in obj.map) || !Array.isArray(obj.map.tiles)) errs.push('map.tiles must be a 2D array');
    }

    if ('maxPlayers' in obj && typeof obj.maxPlayers !== 'number') errs.push('maxPlayers must be a number');

    if ('npcs' in obj && !Array.isArray(obj.npcs)) errs.push('npcs must be an array');
    else {
        for (let i = 0; i < obj.npcs.length; i++) {
            const npc = obj.npcs[i];
            if (typeof npc !== 'object') {
                errs.push(`npcs[${i}] must be an object`);
                continue;
            }
            if (!('moving_event' in npc) || typeof npc.moving_event !== 'string') errs.push(`npcs[${i}].moving_event must be a string`);
            if (!('type' in npc) || typeof npc.type !== 'string') errs.push(`npcs[${i}].type must be a string`);
            if (!('count' in npc) || typeof npc.count !== 'number') errs.push(`npcs[${i}].count must be a number`);
            if (!('capacity' in npc) || typeof npc.capacity !== 'number') errs.push(`npcs[${i}].capacity must be a number`);
        }
    }

    if ('parcels' in obj) {
        if (typeof obj.parcels !== 'object') errs.push('parcels must be an object');
        else {
            if ('generation_event' in obj.parcels && ! ['frame','1s','2s','5s','10s'].includes(obj.parcels.generation_event)) errs.push('parcels.generation_event must be one of frame, 1s, 2s, 5s, 10s');
            if ('decading_event' in obj.parcels && ! ['frame','1s','2s','5s','10s'].includes(obj.parcels.generation_event)) errs.push('parcels.decading_event must be one of frame, 1s, 2s, 5s, 10s');
            if ('max' in obj.parcels && typeof obj.parcels.max !== 'number') errs.push('parcels.max must be a number');
            if ('reward_avg' in obj.parcels && typeof obj.parcels.reward_avg !== 'number') errs.push('parcels.reward_avg must be a number');
            if ('reward_variance' in obj.parcels && typeof obj.parcels.reward_variance !== 'number') errs.push('parcels.reward_variance must be a number');
        }
    }

    if ('player' in obj) {
        if (typeof obj.player !== 'object') errs.push('player must be an object');
        else {
            if ('movement_duration' in obj.player && typeof obj.player.movement_duration !== 'number') errs.push('player.movement_duration must be a number');
            if ('agents_observation_distance' in obj.player && typeof obj.player.agents_observation_distance !== 'number') errs.push('player.agents_observation_distance must be a number');
            if ('parcels_observation_distance' in obj.player && typeof obj.player.parcels_observation_distance !== 'number') errs.push('player.parcels_observation_distance must be a number');
            if ('capacity' in obj.player && typeof obj.player.capacity !== 'number') errs.push('player.capacity must be a number');
        }
    }

    return errs;
}

function parseJson() {
    try {
        const obj = JSON.parse(jsonText.value);
        const errs = validateGameOptions(obj);
        validation.errors.length = 0;
        errs.forEach(e => validation.errors.push(e));
        validation.valid = errs.length === 0;

        // normalize the editor text to the pretty-printed canonical form
        try {
            jsonText.value = prettyStringify(obj);
        } catch (e) {
            jsonText.value = JSON.stringify(obj, null, 2);
        }

        parsed.value = obj;
    } catch (e) {
        parsed.value = null;
        validation.valid = false;
        validation.errors.length = 0;
        validation.errors.push('Invalid JSON: ' + e.message);
    }
}

function prettyStringify(obj) {
    let s = JSON.stringify(obj, null, 2);
    const key = '"tiles"';
    let pos = s.indexOf(key);
    // handle multiple occurrences (compact each)
    while (pos !== -1) {
        const arrStart = s.indexOf('[', pos);
        if (arrStart === -1) break;
        // find matching closing bracket for this array
        let depth = 0;
        let i = arrStart;
        for (; i < s.length; i++) {
            if (s[i] === '[') depth++;
            else if (s[i] === ']') {
                depth--;
                if (depth === 0) break;
            }
        }
        if (i >= s.length) break;
        const arrStr = s.slice(arrStart, i + 1);
        try {
            const tiles = JSON.parse(arrStr);
            if (Array.isArray(tiles) && tiles.every(r => Array.isArray(r))) {
                const lastNewline = s.lastIndexOf('\n', arrStart);
                const indentSize = arrStart - lastNewline - 1;
                const indent = ' '.repeat(indentSize);
                const inner = tiles.map(row => indent + '  ' + JSON.stringify(row)).join(',\n');
                const newArr = '[\n' + inner + '\n' + indent + ']';
                s = s.slice(0, arrStart) + newArr + s.slice(i + 1);
                // continue search after the replaced block
                pos = s.indexOf(key, arrStart + newArr.length);
                continue;
            }
        } catch (e) {
            // ignore parse errors and fall back
        }
        pos = s.indexOf(key, i + 1);
    }
    return s;
}

function loadGame() {
    if (!admin.value) return;
    parseJson();
    if (!validation.valid) return;
    // send GAME config to server using the parsed (and normalized) object
    api.patchConfig(connection.token, { GAME: parsed.value });
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

        <!-- JSON editor and preview -->
        <div class="flex flex-row gap-4">

            <div class="w-full">
                <div class="flex items-center justify-between mb-2">
                    <h3 class="text-md">
                        Edit JSON
                    </h3>
                    <div class="space-x-2">
                        <button class="btn btn-xs" @click="parseJson">Validate</button>
                        <button class="btn btn-xs btn-primary" @click="loadGame" :disabled="!admin || !validation.valid">Load Game</button>
                    </div>
                </div>
                <textarea v-model="jsonText" rows="20" class="w-full textarea textarea-bordered text-base-content"
                    @focus="inputFocused = 'GAME_JSON'"
                    @input="parseJson"
                    :disabled="!admin"
                ></textarea>
                <div class="mt-2 text-xs">
                    <div v-if="validation.valid" class="text-success">JSON valid</div>
                    <div v-else class="text-error">
                        <div v-for="err in validation.errors">- {{ err }}</div>
                    </div>
                </div>
            </div>

            <!-- <div class="w-1/2">
                <h3 class="text-md mb-2">Preview</h3>
                <div class="bg-slate-200 p-2 rounded max-h-[520px] overflow-auto text-sm">
                    <template v-if="parsed">
                        <pre class="whitespace-pre-wrap font-mono text-xs">{{ jsonText }}</pre>
                    </template>
                    <div v-else class="text-xs text-gray-500">No valid JSON to preview</div>
                </div>
            </div> -->

        </div>
    </div>

</main>
</template>

<style scoped>
</style>