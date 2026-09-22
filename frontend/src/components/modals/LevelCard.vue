<script setup>
    import { computed, ref, watch } from 'vue';
    import { connection } from '@/states/myConnection.js';
    import api from '../../utils/api.js';

    // @ts-ignore
    var HOST = import.meta.env.VITE_SOCKET_IO_HOST || window.location.origin;

    const props = defineProps({
        modelValue: { type: Object, default: () => ({}) }
    });

    const emit = defineEmits(['update:modelValue', 'openGameOptions']);

    /** This is done only to forcefully apply JSDoc typing on props.level */
    /** @type {import('vue').Ref< import('@unitn-asa/deliveroo-js-sdk/client').IOGameOptions & { self: string, png: string, layers?: { npcs?: string, observation?: string } } >} */
    // @ts-ignore
    const level = ref({});

    watch(() => props.modelValue, (newValue) => {
        Object.assign(level.value, newValue);
    }, { immediate: true, deep: true });

    // Rows are already stored top-to-bottom in the file representation.
    const mapRows = computed(() => {
        if (!level.value?.map?.tiles) return [];
        return level.value.map.tiles.map(row => row.match(/.{1,2}/g)?.map(tile => tile.trim()) || []);
    });

    // Player attributes seeded at agent creation (plugin-owned, e.g. movement_mode)
    const attributeCount = computed(() => Object.keys(level.value?.player?.attributes ?? {}).length);

    // Check if a tile (in rendered coordinates) is within the sensing distance from center
    function isInSensingArea(rowIndex, colIndex) {
        if (!level.value?.map?.tiles) return false;
        const WIDTH = level.value.map.width;
        const HEIGHT = level.value.map.height;

        const centerX = Math.floor(WIDTH / 2);
        const centerY = Math.floor(HEIGHT / 2);

        // Convert rendered coordinates back to original map coordinates
        const originalX = colIndex;
        const originalY = HEIGHT - 1 - rowIndex;

        const manhattanDistance = Math.abs(originalX - centerX) + Math.abs(originalY - centerY);
        const observationDistance = level.value?.player?.observation_distance ?? 0;

        return observationDistance !== -1 && manhattanDistance <= observationDistance;
    }

    // Generate random positions for NPCs with animation parameters
    const npcPositions = computed(() => {
        if (!level.value?.npcs || !level.value?.map?.tiles) return [];

        const WIDTH = level.value.map.width;
        const HEIGHT = level.value.map.height;
        const npcs = [];

        // Use player.movement_duration for time taken to move one tile (in ms)
        const movementDuration = level.value?.player?.movement_duration || 1000;

        let id = 0;
        for (const npcType of level.value.npcs) {
            for (let i = 0; i < npcType.count; i++) {
                // Generate random position
                const x = Math.floor(Math.random() * WIDTH);
                const y = Math.floor(Math.random() * HEIGHT);

                // Parse npc.moving_event (wait time between movements)
                // Can be: "frame", "1s", "2s", "5s", "10s", or "infinite"
                let waitTime = 2000; // default 2 seconds wait between movements
                let isFrameBased = false;

                if (npcType.moving_event && npcType.moving_event !== 'infinite') {
                    if (npcType.moving_event === 'frame') {
                        // Frame-based movement (no wait, moves every frame)
                        waitTime = 0;
                        isFrameBased = true;
                    } else {
                        // Parse time-based values: "1s", "2s", "500ms", etc.
                        const match = npcType.moving_event.match(/(\d+)\s*(s|ms)?/);
                        if (match) {
                            const value = parseInt(match[1]);
                            const unit = match[2] === 'ms' ? 1 : 1000;
                            waitTime = value * unit;
                        }
                    }
                }

                // Calculate animation parameters
                // For each tile move: movementDuration (moving) + waitTime (waiting)
                // We show NPCs moving 1 tile back and forth
                const tilesToMove = 1; // Show simple 1-tile movement

                // Total cycle for one direction and back:
                // Move there (movementDuration) + Wait (waitTime) + Move back (movementDuration) + Wait (waitTime)
                const totalCycleDuration = (movementDuration * 2 + waitTime * 2) / 1000; // in seconds

                // Calculate actual percentage points for keyframe animation
                const totalMs = movementDuration * 2 + waitTime * 2;
                const p1 = (movementDuration / totalMs) * 100; // end of first move
                const p2 = ((movementDuration + waitTime) / totalMs) * 100; // end of first wait
                const p3 = ((movementDuration * 2 + waitTime) / totalMs) * 100; // end of second move

                // Generate unique keyframe animation name for this NPC
                const animNameH = `moveH-${id}`;
                const animNameV = `moveV-${id}`;

                // Inject dynamic keyframes for this NPC
                const style = document.createElement('style');
                style.textContent = `
                    @keyframes ${animNameH} {
                        0% { transform: translateX(0); }
                        ${p1.toFixed(2)}% { transform: translateX(var(--movement)); }
                        ${p2.toFixed(2)}% { transform: translateX(var(--movement)); }
                        ${p3.toFixed(2)}% { transform: translateX(0); }
                        100% { transform: translateX(0); }
                    }
                    @keyframes ${animNameV} {
                        0% { transform: translateY(0); }
                        ${p1.toFixed(2)}% { transform: translateY(var(--movement)); }
                        ${p2.toFixed(2)}% { transform: translateY(var(--movement)); }
                        ${p3.toFixed(2)}% { transform: translateY(0); }
                        100% { transform: translateY(0); }
                    }
                `;
                document.head.appendChild(style);

                // Random start delay for natural movement
                const delay = Math.random() * 2; // 0-2 seconds
                const direction = Math.random() > 0.5 ? 'horizontal' : 'vertical';

                npcs.push({
                    id: id++,
                    type: npcType.type,
                    x: x,
                    y: y,
                    tilesToMove: tilesToMove,
                    duration: totalCycleDuration,
                    delay: delay,
                    direction: direction,
                    movingEvent: npcType.moving_event,
                    animNameH: animNameH,
                    animNameV: animNameV
                });
            }
        }

        return npcs;
    });

    async function loadLevel() {
        await api.patchConfig(connection.token, { GAME: level.value });
        // emit('update:modelValue', level);
    }

    function openGameOptions() {
        emit('openGameOptions', level.value);
    }
</script>

<template>
    <div class="card bg-base-200 text-base-content shadow-sm hover:shadow-xl transition-shadow duration-300">
        <div class="card-body relative p-3 gap-2">

            <!-- Link to the game json (top-right corner) -->
            <a :href="HOST+level?.self" class="absolute top-2 right-2 tooltip" :data-tip="HOST+level?.self" target="_blank" rel="noopener noreferrer" v-if="level?.self">
                🔗
            </a>

            <!-- Header: title on its own row, description when present -->
            <div>
                <h3 class="text-base font-semibold truncate text-center tooltip" :data-tip="'Title: ' + level?.title">
                    {{ level?.title }}
                </h3>
                <div class="text-xs italic text-base-content/60 line-clamp-3 text-center tooltip" v-if="level?.description" :data-tip="level?.description">
                    {{ level?.description }}
                </div>
            </div>

            <!-- Player: compact chips + attributes (no container box, tooltip kept) -->
            <div class="text-xs tooltip"
                    :data-tip="JSON.stringify(level?.player, null, 2)"
                    v-if="level?.player">

                <div class="flex flex-wrap gap-1 items-center">
                    <span class="inline-flex items-center gap-1 px-1.5 py-1 bg-base-300 rounded-lg text-xs">
                        <span class="opacity-60">move</span>
                        <span class="font-mono">{{ level?.player?.movement_duration }}ms</span>
                    </span>
                    <span class="inline-flex items-center gap-1 px-1.5 py-1 bg-base-300 rounded-lg text-xs">
                        <span class="opacity-60">cap</span>
                        <span class="font-mono">{{ level?.player?.capacity == -1 ? '∞' : level?.player?.capacity }}</span>
                    </span>
                    <span class="inline-flex items-center gap-1 px-1.5 py-1 bg-base-300 rounded-lg text-xs">
                        <span class="opacity-60">obs</span>
                        <span class="font-mono">{{ level?.player?.observation_distance == -1 ? '∞' : level?.player?.observation_distance }}</span>
                    </span>
                </div>

                <!-- Attributes seeded at agent creation (plugin-owned) -->
                <div class="flex flex-wrap gap-1 items-center mt-1" v-if="attributeCount > 0">
                    <span v-for="(value, key) in (level?.player?.attributes ?? {})" :key="key" class="inline-flex items-center gap-1 px-1.5 py-1 bg-base-300 rounded-lg text-xs font-mono">
                        <span class="opacity-60">{{ key }}</span>
                        <span class="text-info">{{ value }}</span>
                    </span>
                </div>

            </div>

            <!-- Plugins + NPCs -->
            <div class="flex flex-wrap gap-1 items-center" v-if="(level?.npcs && level?.npcs.length) || level?.plugins?.length">
                <span v-for="plugin in (level?.plugins ?? [])" :key="plugin"
                        class="badge badge-sm font-mono bg-primary/20 text-primary tooltip"
                        :data-tip="'Plugin: ' + plugin">
                    {{ plugin }}
                </span>
                <span v-for="npc in level?.npcs" :key="npc.type"
                        class="inline-flex items-center gap-1 px-1.5 py-1 bg-base-300 rounded-lg text-xs tooltip"
                        :data-tip="JSON.stringify(npc, null, 2)">
                    🤖 <span class="font-mono">{{ npc.count }}×</span>
                    {{ npc.type }}
                </span>
            </div>

            <!-- Parcels -->
            <div class="px-1.5 py-1 bg-base-300 rounded-lg text-xs font-mono tooltip flex flex-wrap gap-x-2 gap-y-0.5 items-center justify-between"
                    :data-tip="JSON.stringify(level?.parcels, null, 2)"
                    v-if="level?.parcels">
                <span>📦 {{ level?.parcels.max }}× @{{ level?.parcels.generation_event }}</span>
                <span class="text-success">{{ level?.parcels.reward_avg }}±{{ level?.parcels.reward_variance }}</span>
                <span class="text-error" v-if="level?.parcels.decaying_event !== 'infinite'">−1pt/{{ level?.parcels.decaying_event }}</span>
                <span class="text-error" v-else>no decay</span>
            </div>

            <!-- Map Preview: the wrapper takes the map aspect ratio, so it coincides with the image area -->
            <div v-if="level?.png" class="relative flex items-center justify-center">
                <div
                    class="relative rounded-lg overflow-hidden"
                    :style="{
                        aspectRatio: `${level?.map?.width}/${level?.map?.height}`,
                        width: `min(100%, ${(10 * (level?.map?.width ?? 1) / (level?.map?.height ?? 1)).toFixed(3)}rem)`
                    }"
                >
                    <!-- Base Map Layer -->
                    <img :src="HOST+level?.png" class="absolute inset-0 w-full h-full" />

                    <!-- NPC Animation Layer (if available) -->
                    <img
                        v-if="level?.layers?.npcs"
                        :src="HOST+level.layers.npcs"
                        class="absolute inset-0 w-full h-full"
                        style="image-rendering: pixelated;"
                    />

                    <!-- Observation Area Layer (if available) -->
                    <img
                        v-if="level?.layers?.observation"
                        :src="HOST+level.layers.observation"
                        class="absolute inset-0 w-full h-full"
                    />

                    <!-- Fallback: CSS-based sensing area overlay if no observation layer -->
                    <div
                        v-if="!level?.layers?.observation"
                        class="absolute inset-0"
                        :style="{
                            display: 'grid',
                            gridTemplateColumns: `repeat(${level?.map?.width}, 1fr)`,
                            gridTemplateRows: `repeat(${level?.map?.height}, 1fr)`
                        }"
                    >
                        <template v-for="(_, rowIndex) in mapRows" :key="`row-${rowIndex}`">
                            <div
                                v-for="(_, colIndex) in level?.map?.width"
                                :key="`cell-${rowIndex}-${colIndex}`"
                                class="w-full h-full"
                                :class="{ 'bg-info/30 hover:bg-info/50 transition-colors': isInSensingArea(rowIndex, colIndex) }"
                            />
                        </template>
                    </div>

                    <!-- Map size -->
                    <span class="absolute top-1 right-1 badge badge-sm badge-ghost font-mono" v-if="level?.map?.width">
                        {{ level?.map?.width }}×{{ level?.map?.height }}
                    </span>
                </div>
            </div>
            <div v-else class="relative rounded-lg overflow-hidden">
                    <!-- <div class="text-xs text-center text-base-content/60">No map preview available</div> -->
                    <div class="flex justify-center" v-for="(row, rowIndex) in mapRows" >
                        <div class="bg-purple-500 text-white" v-for="(type, colIndex) in row" >
                            <div
                                class="w-3 h-3 border border-base-content text-[10px] flex items-center justify-center overflow-hidden"
                                :class="{
                                    'bg-black text-white': type == '0',
                                    'bg-green-700': type == '1',
                                    'bg-red-500 text-white': type == '2',
                                    'bg-gray-300 text-black': type == '3',
                                    'bg-blue-500 text-white': type == '↓' || type == '↑' || type == '→' || type == '←',
                                    'bg-yellow-400 text-black': type == '5',
                                    'bg-yellow-500 text-black': type == '5!',
                                    'opacity-40': isInSensingArea(rowIndex, colIndex)
                                }"
                            >{{ type }}</div>
                        </div>
                    </div>
                    <!-- NPCs overlay for tile-based preview -->
                    <div
                        v-for="npc in npcPositions"
                        :key="`npc-tile-${npc.id}`"
                        class="npc-indicator"
                        :style="{
                            left: `${npc.x * 12 + 2}px`,
                            top: `${npc.y * 12 + 2}px`,
                            '--movement': `${npc.tilesToMove * 12}px`,
                            'animation-name': npc.direction === 'horizontal' ? npc.animNameH : npc.animNameV,
                            'animation-duration': `${npc.duration}s`,
                            'animation-delay': `${npc.delay}s`
                        }"
                        :title="`${npc.type} NPC (${npc.movingEvent}) at (${npc.x}, ${npc.y})`"
                    />
            </div>

            <!-- Action Buttons -->
            <div class="flex gap-2">
                <button class="btn btn-primary btn-xs flex-1 tooltip" @click="loadLevel()" :data-tip="'Start ' + level?.title">
                    🏁 start
                </button>
                <button class="btn btn-secondary btn-xs flex-1 tooltip" @click="openGameOptions()" data-tip="Edit game options">
                    🛠 edit
                </button>
            </div>
        </div>
    </div>
</template>

<style scoped>
.npc-indicator {
    position: absolute;
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background-color: oklch(0.6 0.2 250); /* info color equivalent */
    border: 1px solid white;
    box-shadow: 0 0 4px rgba(0, 0, 0, 0.5);
    z-index: 10;
    animation-timing-function: ease-in-out;
    animation-iteration-count: infinite;
}

</style>
