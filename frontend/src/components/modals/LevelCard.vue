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

    // Check if a grid cell in the vision indicator diamond should be highlighted
    function isInVisionDiamond(rowIndex, colIndex, distance) {
        const center = distance; // Center index in a (distance*2+1) grid
        const manhattanDistance = Math.abs(rowIndex - center) + Math.abs(colIndex - center);
        return manhattanDistance <= distance;
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
        <!-- Card Header -->
        <div class="card-body p-4">

            <!-- Title -->
            <div class="flex justify-center gap-2 mb-1 tooltip" :data-tip="'Title: ' + level?.title">
                <h3 class="card-title text-lg">
                    {{ level?.title }}
                </h3>
                <!-- open api/games/* in a separate window -->
                <a :href="HOST+level?.self" class="tooltip" :data-tip="HOST+level?.self" target="_blank" rel="noopener noreferrer" v-if="level?.self">
                    {{level.self ? '🔗' : ''}}
                </a>
            </div>

            <!-- Description -->
            <div class="p-2 bg-base-300 rounded-lg text-xs">
                <div class=" italic"
                    v-if="level?.description">
                    {{ level?.description }}
                </div>
            </div>

            <!-- Player (spans 2 columns) -->
            <div class="stat p-2 bg-base-300 rounded-lg p-0 col-span-2 text-xs text-left tooltip"
                    :data-tip="JSON.stringify(level?.player, null, 2)"
                    v-if="level?.player">

                <!-- Player card title -->
                <div class="stat-title text-[10px]">
                    Player
                </div>

                <!-- Stats Grid -->
                <div class="grid grid-cols-2 gap-1">

                    <!-- Type -->
                    <div class="bg-base-300 rounded-lg text-left">
                        <div class="stat-value">Type {{ level?.player?.agent_type ? level?.player?.agent_type : 'N/A' }}</div>
                    </div>

                    <!-- Movement -->
                    <div class="bg-base-300 rounded-lg">
                        <div class="stat-title text-[10px]">Move duration</div>
                        <div class="grid grid-cols-2 items-center">
                            <div class="stat-value text-sm">{{ level?.player?.movement_duration }}ms</div>
                            <div class="relative h-1 bg-base-200 rounded-full overflow-hidden">
                                <div
                                    class="absolute top-0 left-0 h-full bg-info animate-progress"
                                    :style="`animation-duration: ${level?.player?.movement_duration*10}ms;`">
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Capacity -->
                    <div class="bg-base-300 rounded-lg">
                        <div class="stat-title text-[10px]">Capacity</div>
                        <div class="flex flex-wrap gap-0.5 items-center">
                            <div class="stat-value text-xs">{{ level?.player?.capacity == -1 ? '∞' : level?.player?.capacity }}</div>
                            <div
                                v-for="n in Math.max(0, level?.player?.capacity > 0 ? level?.player?.capacity : 0)"
                                :key="n"
                                class="w-2 h-2 rounded-sm bg-warning"
                                :title="`Parcel ${n}`">
                            </div>
                        </div>
                    </div>

                    <!-- Vision -->
                    <div class="bg-base-300 rounded-lg">
                        <div class="stat-title text-[10px]">Vision</div>
                        <div class="flex items-center justify-center gap-2">
                            <div class="stat-value text-xs">{{ level?.player?.observation_distance == -1 ? '∞' : level?.player?.observation_distance }}</div>
                            <div
                                v-if="level?.player?.observation_distance != -1"
                                class="grid gap-px"
                                :style="{
                                    gridTemplateColumns: `repeat(${level?.player?.observation_distance * 2 + 1}, 4px)`,
                                    gridTemplateRows: `repeat(${level?.player?.observation_distance * 2 + 1}, 4px)`
                                }"
                            >
                                <template v-for="(_, rowIndex) in (level?.player?.observation_distance * 2 + 1)" :key="`row-${rowIndex}`">
                                    <div
                                        v-for="(_, colIndex) in (level?.player?.observation_distance * 2 + 1)"
                                        :key="`cell-${rowIndex}-${colIndex}`"
                                        class="w-1 h-1"
                                        :class="{ 'bg-info rounded-sm': isInVisionDiamond(rowIndex, colIndex, level?.player?.observation_distance) }"
                                    />
                                </template>
                            </div>
                            <div v-else class="text-info text-xs">∞</div>
                        </div>
                    </div>

                </div>

            </div>

            <!-- NPCs Section -->
            <div class="mb-0 p-2 bg-base-300 rounded-lg" v-if="level?.npcs && level?.npcs.length">
                <div class="text-[11px] text-base-content/60">NPCs</div>
                <div class="flex flex-wrap gap-1">
                    <span class="badge badge-ghost badge-sm flex items-center gap-1 tooltip"
                    :data-tip="JSON.stringify(npc, null, 2)"
                    v-for="npc in level?.npcs" :key="npc.type">
                        {{ npc.count }}
                        <div class="flex flex-wrap gap-0.5">
                            <div
                                v-for="n in Math.max(0, npc.count || 0)"
                                :key="n"
                                class="w-2 h-2 rounded-full bg-info"
                                :title="`NPC ${n}`">
                            </div>
                        </div>
                        {{ npc.type }}
                    </span>
                </div>
            </div>

            <!-- Parcels Section -->
            <div class="p-2 bg-base-300 rounded-lg tooltip"
                    :data-tip="JSON.stringify(level?.parcels, null, 2)"
                    v-if="level?.parcels">
                <div class="flex items-center justify-between text-xs mb-1">
                    <span class="stat-title">Parcels</span>
                    <span class="font-mono">
                        {{ level?.parcels.max }} @{{ level?.parcels.generation_event }}
                    </span>
                </div>
                <div class="mb-2">
                    <div class="flex flex-wrap gap-0.5">
                        <div
                            v-for="n in Math.max(0, level?.parcels?.max || 0)"
                            :key="n"
                            class="w-2 h-2 rounded-sm bg-warning">
                        </div>
                    </div>
                </div>
                <div class="flex items-center justify-between text-xs mb-1">
                    <span class="stat-title"></span>
                    <span class="font-mono">
                        <span class="text-success">
                            {{ level?.parcels.reward_avg }} ± {{ level?.parcels.reward_variance }}
                        </span>
                        <span class="text-error"
                            v-if="level?.parcels.decaying_event !== 'infinite'">
                            - 1pt/{{ level?.parcels.decaying_event }}
                        </span>
                        <span class="text-error" v-else>
                            No decay
                        </span>
                    </span>
                </div>
                <div class="mb-2 text-xs font-mono">
                    <div class="relative h-2 bg-base-content/20 rounded-full overflow-hidden flex">
                        <!-- Upper range (avg <-> avg+variance) -->
                        <div
                            class="absolute h-full bg-warning"
                            :style="`width: ${level?.parcels.reward_variance * 2}%; left: ${level?.parcels.reward_avg - level?.parcels.reward_variance}%`">
                        </div>
                    </div>
                    <!-- Average label positioned below at precise location -->
                    <div class="relative h-1 mt-0.5">
                        <span
                            class="absolute text-[10px] text-warning font-semibold transform -translate-x-2/3 bg-base-300 px-1 z-10"
                            :style="`left: ${level?.parcels.reward_avg - level?.parcels.reward_variance}%`">
                            {{ level?.parcels.reward_avg - level?.parcels.reward_variance }}
                        </span>
                        <span
                            class="absolute text-[10px] text-warning font-semibold transform -translate-x-1/3"
                            :style="`left: ${level?.parcels.reward_avg + level?.parcels.reward_variance}%`">
                            {{ level?.parcels.reward_avg + level?.parcels.reward_variance }}
                        </span>
                    </div>
                </div>
            </div>

            <!-- Map Preview -->
            <div class="bg-base-300 rounded-lg p-2">
                <div class="stat-value text-xs mb-1">{{ level?.map?.width }}×{{ level?.map?.height }}</div>
                <div v-if="level?.png" class="relative w-full bg-slate-800" :style="{ aspectRatio: `${level?.map?.width}/${level?.map?.height}` }">
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
                </div>
                <div v-else class="relative">
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
            </div>

            <!-- Action Buttons -->
            <div class="flex gap-2">
                <button class="btn btn-primary btn-sm flex-1" @click="loadLevel()">
                    Start {{ level?.title }}
                </button>
                <button class="btn btn-secondary btn-sm flex-1" @click="openGameOptions()">
                    Edit
                </button>
            </div>
        </div>
    </div>
</template>

<style scoped>
.stat {
    padding: 0.5rem;
}
.stat-value {
    font-size: 0.875rem;
    font-weight: 600;
}
.stat-title {
    font-size: 0.625rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
}

.animate-progress {
    animation: fillProgress linear infinite;
}

@keyframes fillProgress {
    0% {
        width: 0%;
    }
    100% {
        width: 100%;
    }
}

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
