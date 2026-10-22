<script setup>

    import { reactive, ref, computed, onMounted, onUnmounted } from 'vue';
    import { connection } from '@/states/myConnection.js';
    import { getMissions } from '@/utils/api.js';

    /**
     * Admin-only missions panel: every mission of the game script with its
     * prompt, bonus and award statistics (GET /api/missions). Missions
     * still waiting for their start timer are shown greyed out with a
     * live countdown.
     */
    const missions = reactive({
        available: false,
        list: []
    });

    /** Ticking clock to drive the start countdowns */
    const now = ref(Date.now());

    let pollingInterval = null;
    let clockInterval = null;

    async function refreshMissions() {
        try {
            const { status, body } = await getMissions(connection?.token);
            if (status !== 200 || !body) {
                missions.available = false;
                missions.list = [];
                return;
            }
            missions.available = true;
            missions.list = body.missions ?? [];
        } catch {
            missions.available = false;
            missions.list = [];
        }
    }

    onMounted(() => {
        refreshMissions();
        pollingInterval = setInterval(refreshMissions, 2000);
        clockInterval = setInterval(() => { now.value = Date.now(); }, 500);
    });

    onUnmounted(() => {
        clearInterval(pollingInterval);
        clearInterval(clockInterval);
    });

    /** @param {object} mission */
    function secondsToStart(mission) {
        if (mission.active || !mission.startsAt) {
            return 0;
        }
        return Math.max(0, Math.ceil((mission.startsAt - now.value) / 1000));
    }

    /**
     * Location chip for missions that expose coordinates (goto, deliverAt):
     * the map prompt may describe the place vaguely, the coordinates are
     * authoritative.
     * @param {object} mission
     * @returns {string} empty when the mission carries no coordinates
     */
    function locationOf(mission) {
        const coordinates = mission?.config?.coordinates;
        if (!Array.isArray(coordinates) || coordinates.length === 0) {
            return '';
        }
        return coordinates.map((xy) => `(${xy.x},${xy.y})`).join(' ');
    }

</script>

<template>
    <main class="text-white p-1 space-y-1">

        <div v-if="!missions.available" class="text-neutral-content text-xs p-2">
            Missions plugin not running
        </div>

        <div v-for="mission in missions.list" :key="mission.index"
             class="rounded-lg bg-neutral px-1 py-0.5 flex flex-row items-start gap-2"
             :class="mission.active ? '' : 'opacity-40'"
        >
            <div class="badge badge-xs shrink-0 mt-0.5"
                 :class="mission.bonus >= 0 ? 'badge-success' : 'badge-error'"
            >
                {{ mission.bonus >= 0 ? '+' : '' }}{{ mission.bonus }}
            </div>
            <div class="flex-1 min-w-0 text-xs break-words whitespace-normal">
                {{ mission.prompt }}
                <span v-if="locationOf(mission)" class="text-neutral-content font-mono">📍 {{ locationOf(mission) }}</span>
                <span v-if="!mission.active" class="text-warning">⏳ starts in {{ secondsToStart(mission) }}s</span>
            </div>
            <div class="text-xs text-info shrink-0 mt-0.5" :title="`claimed ${mission.stats?.awards ?? 0} time(s)`">
                {{ mission.stats?.awards ?? 0 }}×
            </div>
        </div>

    </main>
</template>

<style>
</style>
