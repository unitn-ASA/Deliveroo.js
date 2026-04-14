<script setup>
import { computed } from 'vue';
import { connection } from '../states/myConnection.js';

const latency = computed(() => connection?.latency?.value);

const latencyClass = computed(() => {
    const rt = latency.value?.roundTrip || 0;
    if (rt < 50) return 'text-green-500';
    if (rt < 100) return 'text-yellow-500';
    return 'text-red-500';
});

</script>

<template>
    <div v-if="latency" class="text-xs font-mono flex items-center gap-1">
        (frame {{ latency.frame }})
        (ping
        <span :class="latencyClass">
            {{ latency.roundTrip }}ms
        </span>)
    </div>
    <div v-else class="text-xs text-white/50 font-mono">--ms</div>
</template>
