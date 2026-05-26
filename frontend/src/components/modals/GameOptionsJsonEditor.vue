<script setup>

import { ref, reactive, computed, watch } from 'vue'
import { connection } from '@/states/myConnection.js';
import api from '../../utils/api.js';
import { validateGameOptions } from '@unitn-asa/deliveroo-js-assets/validation.js';

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

// Validate JSON and update local state, returns the parsed object or null
function validateJson() {
    try {
        const obj = JSON.parse(jsonText.value);
        // Use the shared validation module from @unitn-asa/deliveroo-js-assets
        const validationResult = validateGameOptions(obj);
        validation.errors.length = 0;
        if (validationResult.valid) {
            validation.valid = true;
            parsed.value = obj;
            return obj;
        } else {
            validation.valid = false;
            // Convert ValidationError objects to simple strings for UI
            validationResult.errors.forEach(e => validation.errors.push(e.toString()));
            return null;
        }
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

function saveJson() {
    // Validate before saving
    const obj = validateJson();
    if (!obj) return;

    // Create filename from title or default
    const filename = (obj.title || 'level') + '.json';

    // Create blob and download
    const blob = new Blob([jsonText.value], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
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
            <textarea v-model="jsonText" rows="40" class="w-full textarea bg-base-300 text-base-content text-xs font-mono whitespace-nowrap"
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
                    <button class="btn btn-sm btn-success" @click="saveJson" :disabled="!validation.valid">Save Json</button>
                    <button class="btn btn-sm btn-primary" @click="loadGame" :disabled="!admin || !validation.valid">Start Game</button>
                </div>

            </div>

    </div>
</main>
</template>

<style scoped>
</style>
