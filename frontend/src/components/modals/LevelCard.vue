<script setup>
    import { computed, ref, watch } from 'vue';
    import { connection } from '@/states/myConnection.js';
    import api from '../../utils/api.js';

    // @ts-ignore
    var HOST = import.meta.env.VITE_SOCKET_IO_HOST || window.location.origin;

    const props = defineProps({
        modelValue: { type: Object, default: () => ({}) }
    });

    const emit = defineEmits(['update:modelValue']);

    /** This is done only to forcefully apply JSDoc typing on props.level */
    /** @type {import('vue').Ref< import('@unitn-asa/deliveroo-js-sdk/client').IOGameOptions & { self: string, png: string } >} */
    // @ts-ignore
    const level = ref({});

    watch(() => props.modelValue, (newValue) => {
        Object.assign(level.value, newValue);
    }, { immediate: true, deep: true });

    // Create a transposed (columns on rows) and vertically flipped copy of tiles
    const transposeAndFlipVertically = computed(() => {
        if (!level.value?.map?.tiles) return [];
        const transposed = [];
        const WIDTH = level.value.map.tiles.length;
        const HEIGHT = level.value.map.tiles[0].length;
        for (let y = HEIGHT-1; y >= 0; y--) {
            const row = [];
            for (let x = 0; x < WIDTH; x++) {
                row.push(level.value.map.tiles[x][y]);
            }
            transposed.push(row);
        }
        return transposed;
    });

    async function loadLevel() {
        await api.patchConfig(connection.token, { GAME: level.value });
        // emit('update:modelValue', level);
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
                        <div class="stat-value text-sm mt-1 mb-2">
                            <div class="flex items-center justify-center gap-0.5">
                                <!-- Agents to the left -->
                                <div v-if=" // @ts-ignore
                                            level?.player?.observation_distance == -1">
                                    ∞
                                </div>
                                <div
                                    v-else
                                        v-for="// @ts-ignore
                                            n in Math.max(0, level?.player?.observation_distance - 1)"
                                            :key="'left-' + n"
                                            class="w-1 h-1 rounded-full bg-info">
                                </div>
                                <!-- You in the middle -->
                                <div class="w-1.5 h-1.5 rounded-full bg-primary" title="You"></div>
                                <!-- Parcels to the right -->
                                <div v-if=" // @ts-ignore
                                            level?.player?.observation_distance == -1">
                                    ∞
                                </div>
                                <div
                                    v-else
                                    v-for="n in Math.max(0, level?.player?.observation_distance - 1)"
                                    :key="'right-' + n"
                                    class="w-1 h-1 rounded-sm bg-warning">
                                </div>
                            </div>
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
                <div class="stat-value text-xs mb-1">{{ level?.map?.tiles?.length }}×{{ level?.map?.tiles?.[0]?.length }}</div>
                <img v-if="level?.png" :src="HOST+level?.png" class="w-full h-auto bg-slate-800" :title="`${level?.map?.width}×${level?.map?.height}`"/>
                <div v-else>
                    <!-- <div class="text-xs text-center text-base-content/60">No map preview available</div> -->
                    <div class="flex justify-center" v-for="row in transposeAndFlipVertically" >
                        <div class="bg-purple-500 text-white" v-for="type in row" >
                            <div
                                class="w-3 h-3 border border-base-content text-[10px] flex items-center justify-center overflow-hidden"
                                :class="{
                                    'bg-black text-white': type == '0',
                                    'bg-green-700': type == '1',
                                    'bg-red-500 text-white': type == '2',
                                    'bg-gray-300 text-black': type == '3',
                                    'bg-blue-500 text-white': type == '↓' || type == '↑' || type == '→' || type == '←',
                                    'bg-yellow-400 text-black': type == '5',
                                    'bg-yellow-500 text-black': type == '5!'
                                }"
                            >{{ type }}</div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Load Button -->
            <button class="btn btn-primary btn-sm w-full" @click="loadLevel()">
                Load {{ level?.title }}
            </button>
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

</style>
