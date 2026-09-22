<script setup>
import { computed } from 'vue';
import { connection } from '../states/myConnection.js';

const latency = computed(() => connection?.latency?.value);
const frame = computed(() => connection?.serverFrame?.value || latency.value?.frame || 0);
const sensingPerFrame = computed(() => connection?.sensingPerFrame?.value || 0);
const moveMs = computed(() => connection?.moveMs?.value || 0);

const latencyClass = computed(() => {
    const rt = latency.value?.roundTrip || 0;
    if (rt < 50) return 'text-green-500';
    if (rt < 100) return 'text-yellow-500';
    return 'text-red-500';
});

</script>

<template>
    <div v-if="latency" class="text-xs font-mono flex flex-wrap items-center justify-end gap-x-1 gap-y-0.5">
        <span class="whitespace-nowrap">(frame {{ frame }})</span>
        <span class="whitespace-nowrap">(ping
            <span :class="latencyClass">{{ latency.roundTrip }}ms</span>)
        </span>
        <span class="whitespace-nowrap">(sensing {{ sensingPerFrame.toFixed(1) }}/frame)</span>
        <span class="whitespace-nowrap" v-if="moveMs > 0">(move {{ Math.round(moveMs) }}ms)</span>
    </div>
    <div v-else class="text-xs text-white/50 font-mono">--ms</div>
</template>
