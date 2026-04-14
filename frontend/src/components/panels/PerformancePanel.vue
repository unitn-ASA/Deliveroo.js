<script setup>
import { ref, computed, watch } from 'vue';
import { connection } from '../../states/myConnection.js';

/** @typedef {import('@unitn-asa/deliveroo-js-sdk/types/IOSocketEvents.js').IOMetrics} IOMetrics */

/**
 * @typedef {{frame: number, roundTrip: number, socketId: string, agentInfo: {id: string, name: string, teamId: string, teamName: string}}} IOLatencyWithSocket
 */

// Computed property for metrics from connection
const metrics = computed(() => connection?.metrics?.value || null);

// Computed properties for formatted metrics
const cpuUsage = computed(() => metrics.value?.cpu?.current || 0);
const fps = computed(() => metrics.value?.timing?.fps || 0);
const heapUsed = computed(() => metrics.value?.memory?.heapUsed || 0);
const heapTotal = computed(() => metrics.value?.memory?.heapTotal || 0);
const eventLoopLag = computed(() => metrics.value?.eventLoop?.currentLag || 0);
const avgLatency = computed(() => metrics.value?.latency?.avg || 0);
const minLatency = computed(() => metrics.value?.latency?.min || 0);
const maxLatency = computed(() => metrics.value?.latency?.max || 0);

// Agent connections (grouped by agent)
const agentConnections = computed(() => {
    if (!metrics.value?.latency?.byAgent) return {};
    return metrics.value.latency.byAgent;
});

// Format uptime as HH:MM:SS with leading zeros
const formattedUptime = computed(() => {
    const uptime = metrics.value?.timing?.uptime || 0;
    const totalSeconds = Math.floor(uptime / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
});

// CPU history for chart (last 60 seconds)
const cpuHistory = ref([]);
const fpsHistory = ref([]);
const latencyHistory = ref([]);
const memoryHistory = ref([]);
const maxHistoryLength = 60;

// Watch metrics changes to update history arrays
watch(metrics, (data) => {
    if (!data) return;

    // Update history arrays
    if (data.cpu?.current !== undefined) {
        cpuHistory.value.push(data.cpu.current);
        if (cpuHistory.value.length > maxHistoryLength) {
            cpuHistory.value.shift();
        }
    }

    if (data.timing?.fps !== undefined) {
        fpsHistory.value.push(data.timing.fps);
        if (fpsHistory.value.length > maxHistoryLength) {
            fpsHistory.value.shift();
        }
    }

    if (data.latency?.avg !== undefined) {
        latencyHistory.value.push(data.latency.avg);
        if (latencyHistory.value.length > maxHistoryLength) {
            latencyHistory.value.shift();
        }
    }

    if (data.memory?.heapUsed !== undefined) {
        memoryHistory.value.push(data.memory.heapUsed);
        if (memoryHistory.value.length > maxHistoryLength) {
            memoryHistory.value.shift();
        }
    }
});

// Helper function to create chart bars
const createBars = (data, max) => {
    if (!data || data.length === 0) return '';

    const barWidth = Math.max(1, Math.floor(100 / data.length));
    return data.map((value, i) => {
        const height = Math.min(100, (value / max) * 100);
        const color = getColor(value, max);
        return `<div class="chart-bar" style="height: ${height}%; width: ${barWidth}%; background-color: ${color};" title="${value.toFixed(1)}"></div>`;
    }).join('');
};

const getColor = (value, max) => {
    if (value < max * 0.5) return 'rgb(34, 197, 94)'; // green
    if (value < max * 0.8) return 'rgb(234, 179, 8)'; // yellow
    return 'rgb(239, 68, 68)'; // red
};
</script>

<template>

    <div v-if="!metrics" class="alert alert-info px-4">
        Waiting for metrics data...
    </div>

    <div v-else class="grid grid-cols-[repeat(auto-fit,minmax(300px,1fr))] gap-4">
        <!-- Timing Metrics -->
        <div class="px-4">
            <div class="flex justify-between items-center">
                <h3 class="font-bold text-white">Timing</h3>
                <span class="text-sm font-bold font-mono" :class="fps < 19 ? 'text-red-500' : 'text-green-500'">@{{ fps.toFixed(1) }} fps</span>
            </div>
            <div class="mt-2">
                <div class="flex items-end gap-px h-[30px] bg-black/30 rounded-sm p-px overflow-hidden" v-html="createBars(fpsHistory, 30)"></div>
            </div>
            <div class="grid grid-cols-2 gap-x-4 mb-1">
                <div class="flex justify-between items-center">
                    <span class="text-xs text-white/70">Frame:</span>
                    <span class="text-sm font-bold font-mono">{{ metrics.timing?.frame || 0 }}</span>
                </div>
                <div class="flex justify-between items-center">
                    <span class="text-xs text-white/70">Time:</span>
                    <span class="text-sm font-bold font-mono">{{ metrics.timing?.ms || 0 }} ms</span>
                </div>
                <div class="flex justify-between items-center">
                    <span class="text-xs text-white/70">Uptime:</span>
                    <span class="text-sm font-bold font-mono">{{ formattedUptime }}</span>
                </div>
                <div class="flex justify-between items-center">
                    <span class="text-xs text-white/70">Current Lag:</span>
                    <span class="text-sm font-bold font-mono" :class="eventLoopLag > 100 ? 'text-red-500' : eventLoopLag > 5 ? 'text-yellow-500' : 'text-green-500'">
                        {{ eventLoopLag }} ms
                    </span>
                </div>
                <div class="flex justify-between items-center">
                    <span class="text-xs text-white/70">Max Lag:</span>
                    <span class="text-sm font-bold font-mono">{{ metrics.eventLoop?.maxLag?.toFixed(2) || 0 }} ms</span>
                </div>
                <div class="flex justify-between items-center">
                    <span class="text-xs text-white/70">Avg Lag:</span>
                    <span class="text-sm font-bold font-mono">{{ metrics.eventLoop?.avgLag?.toFixed(2) || 0 }} ms</span>
                </div>
            </div>
        </div>

        <!-- CPU Metrics -->
        <div class="px-4">
            <div class="flex justify-between items-center">
                <h3 class="font-bold text-white">CPU</h3>
                <span class="text-sm font-bold font-mono" :class="cpuUsage > 80 ? 'text-red-500' : cpuUsage > 50 ? 'text-yellow-500' : 'text-green-500'">
                    {{ cpuUsage }}%
                </span>
            </div>
            <div class="mt-2">
                <div class="flex items-end gap-px h-[30px] bg-black/30 rounded-sm p-px overflow-hidden" v-html="createBars(cpuHistory, 100)"></div>
            </div>
        </div>

        <!-- Memory Metrics -->
        <div class="px-4">
            <div class="flex justify-between items-center">
                <h3 class="font-bold text-white">Memory</h3>
                <span class="text-sm font-bold font-mono" :class="heapUsed > 80 ? 'text-red-500' : heapUsed > 50 ? 'text-yellow-500' : 'text-green-500'">
                    {{ (heapUsed).toFixed(0) }}MB
                    ({{ ((heapUsed / heapTotal) * 100).toFixed(0) }}%)
                    /
                    {{ (heapTotal).toFixed(0) }}MB
                </span>
            </div>
            <!-- Memory Chart -->
            <div class="mt-2">
                <div class="flex items-end gap-px h-[30px] bg-black/30 rounded-sm p-px overflow-hidden" v-html="createBars(memoryHistory, heapTotal || 1000)"></div>
            </div>
            <div class="grid grid-cols-2 gap-x-4 mb-4">
                <div class="flex justify-between items-center">
                    <span class="text-xs text-white/70">Heap Used:</span>
                    <span class="text-sm font-bold font-mono">{{ heapUsed }} MB</span>
                </div>
                <div class="flex justify-between items-center">
                    <span class="text-xs text-white/70">Heap Total:</span>
                    <span class="text-sm font-bold font-mono">{{ heapTotal }} MB</span>
                </div>
                <div class="flex justify-between items-center">
                    <span class="text-xs text-white/70">RSS:</span>
                    <span class="text-sm font-bold font-mono">{{ metrics.memory?.rss || 0 }} MB</span>
                </div>
                <div class="flex justify-between items-center">
                    <span class="text-xs text-white/70">External:</span>
                    <span class="text-sm font-bold font-mono">{{ metrics.memory?.external || 0 }} MB</span>
                </div>
            </div>

        </div>

        <!-- Latency Metrics -->
        <div class="px-4">
            <div class="flex justify-between items-center">
                <h3 class="font-bold text-white">Latency</h3>
                <span class="text-sm font-bold font-mono" :class="avgLatency > 100 ? 'text-red-500' : avgLatency > 50 ? 'text-yellow-500' : 'text-green-500'">
                    {{ avgLatency }} ms
                </span>
            </div>
            <!-- Latency Chart -->
            <div class="mt-2">
                <div class="flex items-end gap-px h-[30px] bg-black/30 rounded-sm p-px overflow-hidden" v-html="createBars(latencyHistory, 200)"></div>
            </div>
            <div class="grid grid-cols-2 gap-x-4 mb-4">
                <div class="flex justify-between items-center">
                    <span class="text-xs text-white/70">Min:</span>
                    <span class="text-sm font-bold font-mono">{{ minLatency }} ms</span>
                </div>
                <div class="flex justify-between items-center">
                    <span class="text-xs text-white/70">Max:</span>
                    <span class="text-sm font-bold font-mono">{{ maxLatency }} ms</span>
                </div>
            </div>
            <!-- Agent Connections -->
            <div class="pt-2 border-t border-white/10" v-if="Object.keys(agentConnections).length > 0">
                <div class="text-xs mb-2">Connections:</div>
                <div class="max-h-64 overflow-y-auto space-y-2">
                    <div v-for="(agent, key) in agentConnections" :key="key" class="bg-black/20 rounded p-2">
                        <div class="font-medium text-white">
                            {{ agent.name }} <span class="text-xs opacity-70">({{ agent.id }})</span>
                            <span v-if="agent.teamName" class="text-xs opacity-70"> - {{ agent.teamName }}({{ agent.teamId }})</span>
                        </div>
                        <div class="mt-1 space-y-1">
                            <div v-for="socket in agent.sockets" :key="socket.socketId" class="text-xs">
                                <span class="font-mono opacity-70">{{ socket.socketId.slice(0, 12) }}...</span>
                                <span :class="socket.avg > 100 ? 'text-red-500' : socket.avg > 50 ? 'text-yellow-500' : 'text-green-500'">
                                    {{ socket.avg }}ms
                                </span>
                                <span class="opacity-60">({{ socket.min }}-{{ socket.max }})</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

</template>

<style>
.chart-bar {
    transition: height 0.3s ease;
    border-radius: 1px 1px 0 0;
}
</style>
