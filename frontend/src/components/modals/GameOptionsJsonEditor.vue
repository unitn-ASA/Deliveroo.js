<script setup>

import { ref, reactive, computed, watch } from 'vue'
import { connection } from '@/states/myConnection.js';
import api from '../../utils/api.js';

const props = defineProps({
    modelValue: { type: Object, default: () => ({}) }
});

const emit = defineEmits(['update:modelValue']);

const inputFocused = ref();

// JSON editor state
const jsonText = ref('');
const parsed = ref({});
const validation = reactive({ valid: false, errors: [] });

const admin = computed(() => connection?.payload?.role == 'admin');

// Initialize jsonText from modelValue when it changes externally (not from user input)
watch(() => props.modelValue, (newValue) => {
    if (newValue && Object.keys(newValue).length > 0) {
        jsonText.value = JSON.stringify(newValue, null, 2);
        const obj = validateJson();
        if (obj) {
            // normalize the editor text to the pretty-printed canonical form
            try {
                jsonText.value = prettyStringify(obj);
            } catch (e) {
                // keep standard stringify if prettyStringify fails
            }
        }
    }
}, { immediate: true, deep: true });

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
            if ('observation_distance' in obj.player && typeof obj.player.observation_distance !== 'number') errs.push('player.observation_distance must be a number');
            if ('capacity' in obj.player && typeof obj.player.capacity !== 'number') errs.push('player.capacity must be a number');
        }
    }

    return errs;
}

// Validate JSON and update local state, returns the parsed object or null
function validateJson() {
    try {
        const obj = JSON.parse(jsonText.value);
        const errs = validateGameOptions(obj);
        validation.errors.length = 0;
        errs.forEach(e => validation.errors.push(e));
        validation.valid = errs.length === 0;
        parsed.value = obj;
        return obj;
    } catch (e) {
        validation.valid = false;
        validation.errors.length = 0;
        validation.errors.push('Invalid JSON: ' + e.message);
        return null;
    }
}

// Parse JSON and emit to parent (for user input)
function onInputChange() {
    const obj = validateJson();
    if (!obj) return;

    // normalize the editor text to the pretty-printed canonical form
    try {
        jsonText.value = prettyStringify(obj);
    } catch (e) {
        jsonText.value = JSON.stringify(obj, null, 2);
    }

    // emit update to parent
    emit('update:modelValue', obj);
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
    onInputChange();
    if (!validation.valid) return;
    // send GAME config to server using the parsed (and normalized) object
    api.patchConfig(connection.token, { GAME: parsed.value });
}

</script>

<template>
<main class="card bg-base-200 text-base-content shadow-sm hover:shadow-xl transition-shadow duration-300" >
    <!-- Card Header -->
    <div class="card-body p-4">

            <!-- Title -->
            <div class="flex justify-center gap-2 mb-1">
                <h3 class="card-title text-lg">
                    Json Editor
                </h3>
            </div>

            <!-- JSON editor -->
            <textarea v-model="jsonText" rows="20" class="w-full textarea bg-base-300 text-base-content text-xs font-mono whitespace-nowrap"
                @focus="inputFocused = 'GAME_JSON'"
                @input="onInputChange"
                :disabled="!admin"
            ></textarea>

            <!-- Load Button and Validation Messages -->
            <div class="flex items-center justify-between">
                
                <!-- Validation Messages -->
                <div v-if="validation.valid" class="text-success">JSON valid</div>
                <div v-else class="text-error">
                    <div v-for="err in validation.errors">- {{ err }}</div>
                </div>
                
                <!-- Load Game Button -->
                <div class="space-x-2">
                    <button class="btn btn-sm btn-primary" @click="loadGame" :disabled="!admin || !validation.valid">Load Game</button>
                </div>

            </div>

    </div>
</main>
</template>

<style scoped>
</style>
