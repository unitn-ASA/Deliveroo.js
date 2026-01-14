<script setup>

    import { ref, inject } from 'vue'
    import { connection } from '@/states/myConnection.js';
    import api from '../../utils/api.js';

    var HOST = import.meta.env.VITE_SOCKET_IO_HOST || window.location.origin;

    const emit = defineEmits(['loadLevel']); // Define the emit for login

    /** @type {import('vue').Ref<import('@unitn-asa/deliveroo-js-sdk/client').IOGameOptions[]>} */
    const levels = ref([]);

    fetch(HOST + "/api/games")
    .then( res => res.json() )
    .then( data => {
        levels.value = data;
    })

    function loadLevel( level ) {
        api.patchConfig( connection.token, { GAME: level} );
        emit('loadLevel', level );
    }

    function exportMap() {
        const grid = connection.grid;
        const WIDTH = Array.from(grid.tiles.values()).reduce( (max, tile) => Math.max(max, tile.x), 0 ) + 1;
        const HEIGHT = Array.from(grid.tiles.values()).reduce( (max, tile) => Math.max(max, tile.y), 0 ) + 1;
        // const WIDTH = grid.width;
        // const HEIGHT = grid.height;
        const tiles = grid.tiles;
        const map = [];
        for ( let x=0; x<WIDTH; x++ ) {
            const row = []
            for ( let y=0; y<HEIGHT; y++ ) {
                if ( tiles.has(x + y*1000) ) {
                    let tile = tiles.get( x + y*1000 );
                    row.push(tile.type);
                }
                else {
                    row.push(0);
                }
            }
            map.push(row);
        }
        var string = "[\n";
        string += map.map( row => '\t[' + row.join(', ') + ']' ).join( ',\n' )
        // for (const row of map) {
        //     string += '\t[' + row.join(', ') + '],\n';
        // }
        string += "\n]";
        console.log( string );
        // copy into clipboard
        navigator.clipboard.writeText( string );
        alert( "Map copied to clipboard!" );
        return map;
    }

</script>

<template>
    <main class="p-4">
        <div class="w-full mx-auto pb-10">
            <!-- Header with Export Button -->
            <div class="flex justify-between items-center mb-6 px-2">
                <h2 class="text-xl font-bold">Select a Game</h2>
                <button class="btn btn-info btn-sm" @click="exportMap()">
                    Export Map
                </button>
            </div>

            <!-- Levels Grid -->
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">

                <!-- Level Card -->
                <div class="card bg-base-200 text-base-content shadow-sm hover:shadow-2xl transition-shadow duration-300"
                    v-for="level of levels">

                    <!-- Card Header -->
                    <div class="card-body p-4">

                        <!-- Title -->
                        <div class="flex justify-center gap-2 mb-1">
                            <h3 class="card-title text-lg">
                                {{ level.title }}
                            </h3>
                            <!-- open api/games/* in a separate window -->
                            <a :href="HOST+level.self" class="tooltip" :data-tip="HOST+level.self" target="_blank" rel="noopener noreferrer">
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
                                    <path fill-rule="evenodd" d="M9 2.221V7H4.221a2 2 0 0 1 .365-.5L8.5 2.586A2 2 0 0 1 9 2.22ZM11 2v5a2 2 0 0 1-2 2H4v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2h-7ZM8 16a1 1 0 0 1 1-1h6a1 1 0 1 1 0 2H9a1 1 0 0 1-1-1Zm1-5a1 1 0 1 0 0 2h6a1 1 0 1 0 0-2H9Z" clip-rule="evenodd"/>
                                </svg>
                            </a>
                        </div>

                        <!-- Description -->
                        <div class="p-2 bg-base-300 rounded-lg text-xs">
                            <div class=" italic"
                                v-if="level.description">
                                {{ level.description }}
                            </div>
                        </div>

                        <!-- Player (spans 2 columns) -->
                        <div class="stat p-2 bg-base-300 rounded-lg p-0 col-span-2 text-xs text-left tooltip"
                                :data-tip="JSON.stringify(level.player, null, 2)">
                            
                            <!-- Player card title -->
                            <div class="stat-title text-[10px]">
                                Player
                            </div>
                            
                            <!-- Stats Grid -->
                            <div class="grid grid-cols-2 gap-1">

                                <!-- Type -->
                                <div class="bg-base-300 rounded-lg text-left">
                                    <div class="stat-value">Type {{ level.player.agent_type ? level.player.agent_type : 'N/A' }}</div>
                                </div>

                                <!-- Movement -->
                                <div class="bg-base-300 rounded-lg">
                                    <div class="stat-title text-[10px]">Move duration</div>
                                    <div class="grid grid-cols-2 items-center">
                                        <div class="stat-value text-sm">{{ level.player.movement_duration }}ms</div>
                                        <div class="relative h-1 bg-base-200 rounded-full overflow-hidden">
                                            <div
                                                class="absolute top-0 left-0 h-full bg-info animate-progress"
                                                :style="`animation-duration: ${level.player.movement_duration*10}ms;`">
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <!-- Capacity -->
                                <div class="bg-base-300 rounded-lg">
                                    <div class="stat-title text-[10px]">Capacity</div>
                                    <div class="flex flex-wrap gap-0.5 items-center">
                                        <div class="stat-value text-xs">{{ level.player.capacity }}</div>
                                        <div
                                            v-for="n in level.player.capacity"
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
                                            <div v-if="level.player.agents_observation_distance == 'infinite'">
                                                ∞
                                            </div>
                                            <div
                                                v-else
                                                v-for="n in Math.max(0, level.player.agents_observation_distance - 1)"
                                                :key="'left-' + n"
                                                class="w-1 h-1 rounded-full bg-info">
                                            </div>
                                            <!-- You in the middle -->
                                            <div class="w-1.5 h-1.5 rounded-full bg-primary" title="You"></div>
                                            <!-- Parcels to the right -->
                                            <div v-if="level.player.parcels_observation_distance == 'infinite'">
                                                ∞
                                            </div>
                                            <div
                                                v-else
                                                v-for="n in Math.max(0, level.player.parcels_observation_distance - 1)"
                                                :key="'right-' + n"
                                                class="w-1 h-1 rounded-sm bg-warning">
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            
                            </div>
                            
                        </div>

                        <!-- NPCs Section -->
                        <div class="mb-0 p-2 bg-base-300 rounded-lg" v-if="level.npcs && level.npcs.length">
                            <div class="text-[11px] text-base-content/60">NPCs</div>
                            <div class="flex flex-wrap gap-1">
                                <span class="badge badge-ghost badge-sm flex items-center gap-1 tooltip"
                                :data-tip="JSON.stringify(npc, null, 2)"
                                v-for="npc in level.npcs" :key="npc.type">
                                    {{ npc.count }}
                                    <div class="flex flex-wrap gap-0.5">
                                        <div
                                            v-for="n in npc.count"
                                            :key="n"
                                            class="w-2 h-2 rounded-sm bg-info"
                                            :title="`NPC ${n}`">
                                        </div>
                                    </div>
                                    {{ npc.type }}
                                </span>
                            </div>
                        </div>

                        <!-- Parcels Section -->
                        <div class="p-2 bg-base-300 rounded-lg tooltip"
                                :data-tip="JSON.stringify(level.parcels, null, 2)">
                            <div class="flex items-center justify-between text-xs mb-1">
                                <span class="stat-title">Parcels</span>
                                <span class="font-mono">
                                    {{ level.parcels.max }} @{{ level.parcels.generation_event }}
                                </span>
                            </div>
                            <div class="mb-2">
                                <div class="flex flex-wrap gap-0.5">
                                    <div
                                        v-for="n in level.parcels.max"
                                        :key="n"
                                        class="w-2 h-2 rounded-sm bg-warning">
                                    </div>
                                </div>
                            </div>
                            <div class="flex items-center justify-between text-xs mb-1">
                                <span class="stat-title"></span>
                                <span class="font-mono">
                                    <span class="text-success">
                                        {{ level.parcels.reward_avg }} ± {{ level.parcels.reward_variance }}
                                    </span>
                                    <span class="text-error"
                                        v-if="level.parcels.decading_event !== 'infinite'">
                                        - 1pt/{{ level.parcels.decading_event }}
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
                                        :style="`width: ${level.parcels.reward_variance * 2}%; left: ${level.parcels.reward_avg - level.parcels.reward_variance}%`">
                                    </div>
                                </div>
                                <!-- Average label positioned below at precise location -->
                                <div class="relative h-1 mt-0.5">
                                    <span
                                        class="absolute text-[10px] text-warning font-semibold transform -translate-x-2/3 bg-base-300 px-1 z-10"
                                        :style="`left: ${level.parcels.reward_avg - level.parcels.reward_variance}%`">
                                        {{ level.parcels.reward_avg - level.parcels.reward_variance }}
                                    </span>
                                    <span
                                        class="absolute text-[10px] text-warning font-semibold transform -translate-x-1/3"
                                        :style="`left: ${level.parcels.reward_avg + level.parcels.reward_variance}%`">
                                        {{ level.parcels.reward_avg + level.parcels.reward_variance }}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <!-- Map Preview -->
                        <div class="mb-4 bg-base-300 rounded-lg  p-2">
                            <div class="stat-value text-xs mb-1">{{ level.map.width }}×{{ level.map.height }}</div>
                            <img :src="HOST+level.png" class="w-full h-auto bg-slate-800" :title="`${level.map.width}×${level.map.height}`"/>
                        </div>

                        <!-- Load Button -->
                        <button class="btn btn-primary btn-sm w-full" @click="loadLevel(level)">
                            Load {{ level.title }}
                        </button>
                    </div>
                </div>

            </div>
        </div>
    </main>
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