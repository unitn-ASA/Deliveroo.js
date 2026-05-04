<script setup>

    import { computed, reactive, watch } from 'vue';
    import Marquee from '../reusable/Marquee.vue'

    import { connection } from '../../states/myConnection.js';
    import { tournament, overall, currentRound, saveRound, deleteRound } from '@/states/myTournament.js';

</script>

<template>
    <main class="text-white">
        <div class="pb-2 flex gap-1">
            
            <!-- Round Tabs -->
            <div
                v-for="round in [...tournament, overall, currentRound]"
                :key="round.roundId"
                class="p-0 align-top flex flex-col gap-1 flex-shrink-0"
                :style="round.roundName == 'Live' ? 'width: calc(20rem - 0.125rem);' : 'width: calc(10rem - 0.125rem);'"
            >
                <!-- Header -->
                <div class="p-1 h-10 flex items-center">
                    <span v-if="round.roundName == 'Live'" class="text-red-500 font-bold">
                        Live
                        <button class="btn btn-xs btn-warning" @click="saveRound">
                            Save
                        </button>
                    </span>
                    <span v-else-if="round.roundName == 'Overall'" class="text-green-500 font-bold">
                        Overall
                    </span>
                    <span v-else class="text-white font-bold">
                        Round #{{ round.roundId }}
                        <button class="btn btn-xs btn-error align-middle" @click="deleteRound(round.roundId)">
                            <!-- Slid black bin -->
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-4 h-4">
                                <path fill-rule="evenodd" d="M6.5 3a1 1 0 0 1 1-1h5a1 1 0 0 1 1 1v1h2.25A2.25 2.25 0 0 1 16 7.25v10.5A2.25 2.25 0 0 1 13.75 20H6.25A2.25 2.25 0 0 1 4 17.75V7.25A2.25 2.25 0 0 1 6.25 5H8V3Zm3.5-1a2.5 2.5 0 0 0-2.5 2.5V5h5V4.5A2.5 2.5 0 0 0 10 .5ZM6.25 7A1.25 1.25 0 0 0 5 8.25v9.5c0 .69.56 1.25 1.25 1.25h7.5c.69 0 1.25-.56 1.25-1.25v-9.5A1.25 1.25 0 0 0 13.75 7H6.25Z" clip-rule="evenodd" />
                            </svg>
                        </button>
                    </span>
                </div>

                <!-- Teams -->
                <div
                    v-for="team in Array.from(round.teams.values())
                    .sort((a, b) => b.score - a.score)"
                    :key="`${round.roundId}-${team.teamName}-${team.rank}`"
                    class=""
                >
                    <!-- One Team -->
                    <div class="hover:opacity-100 rounded-lg bg-neutral"
                         :class=" team.rank ? '' : 'opacity-40'"
                    >
                        
                        <!-- First line -->
                        <div class="px-1 flex flex-row items-top justify-between gap-2">

                            <!-- Left -->
                            <div class="text-lg font-bold shrink-0 min-w-4 text-warning">
                                <!-- Rank -->
                                {{ team.rank ? team.rank + '°' : '#' }}
                            </div>

                            <!-- Center -->
                            <div class="flex-1 overflow-hidden whitespace-nowrap">
                                <!-- First Line -->
                                <div class="flex flex-row justify-between">
                                    
                                    <!-- Left -->
                                    <div class="font-bold overflow-hidden">
                                    {{ team.teamName }}
                                        <!-- <span v-if="team.teamId!=team.teamName">({{ team.teamId }})</span> -->
                                        <!-- <span v-if="team.score" class="text-green-500">+{{ team.score }}</span> -->
                                    </div>

                                    <!-- Right -->
                                    <div class="pl-1 whitespace-nowrap text-right">
                                        <!-- PTI -->
                                        <span v-if="team.pti" class="text-info text-right text-sm font-bold shrink-0">
                                            {{ team.pti }} pti
                                        </span>
                                        <!-- Score -->
                                        <!-- <div class="text-xs text-green-500">
                                            {{ teams.score }}
                                        </div> -->
                                    </div>
                                </div>
                                <!-- Second line -->
                                <div class="flex-1 overflow-hidden whitespace-nowrap text-neutral-content">
                                    <!-- Agents -->
                                    <div v-for="a in team.agents.values()" class="flex flex-row justify-between">
                                        
                                        <!-- Left -->
                                        <div class="overflow-hidden whitespace-nowrap">
                                            <span v-if="a.name!=team.teamName">
                                                {{ a.name?.length > 10
                                                ? a.name.slice(0, 4) + '...' + a.name.slice(-4)
                                                : a.name }}
                                                <!-- ({{ a.id }}) -->
                                            </span>
                                            <span v-else-if="a.id!=team.teamId">
                                                {{ a.id }}
                                            </span>
                                            <span v-if="round.roundName == 'Live'" class="text-red-500">
                                                {{ connection.grid.agents.get(a.id)?.penalty ? ` !${-connection.grid.agents.get(a.id).penalty}` : '' }}
                                            </span>
                                        </div>
                                        
                                        <!-- Right -->
                                        <div class="pl-1 whitespace-nowrap text-right">
                                            <span v-if="a.score" class="text-green-500"> +{{ a.score }} </span>
                                        </div>

                                    </div>
                                </div>
                            </div>

                            <!-- Score -->
                            <!-- <span class="text-error text-right text-lg font-bold shrink-0">
                                {{ result.score }}
                            </span> -->

                            <!-- Right -->
                            <!-- <div class="overflow-hidden whitespace-nowrap text-right">
                                <span class="text-info text-right text-sm font-bold shrink-0">
                                    {{ team.pti }} pti
                                </span>
                            </div> -->
                        </div>

                    </div>
                </div>
            </div>

        </div>    
    </main>
</template>

<style>
</style>