<script setup>

    import { computed, reactive, watch } from 'vue';
    import Marquee from '../reusable/Marquee.vue'

    import { connection } from '../../states/myConnection.js';
    import { tournament, groupByTeam, overall, saveRound, deleteRound } from '@/states/myTournament.js';
    
    if (connection?.grid.agents)
        watch( () => Array.from( connection?.grid.agents.values() ).map( a => a.score ), () => {
            const current = tournament[tournament.length - 1];
            if ( !current ) return;
            for ( const [id, agent] of connection?.grid.agents.entries() ) {
                let result = current.results.get(id);
                if (result) {
                    result.score = agent.score;
                }
                else {
                    // console.log('Adding new result for agent', id, agent.name);
                    current.results.set(id, {
                        id: id,
                        name: agent.name,
                        teamId: agent.teamId,
                        teamName: agent.teamName,
                        score: agent.score
                    });
                }
            }
        }, { immediate: true } );

</script>

<template>
    <main class="text-white">

        <div class="overflow-x-auto pb-2" style="">
            <table class="table table-xs">
                <thead>
                    <tr class="border-0">
                        <th class="text-green-500 font-bold p-1">
                            <div class="rounded-lg bg-neutral p-1 h-10 w-auto">
                                Overall
                            </div>
                        </th>
                        <th v-for="round in tournament" class="p-1">
                            <div class="rounded-lg bg-neutral p-1 h-10">
                                <span v-if="round.status == 'active'" class="text-red-500 font-bold">
                                    LIVE
                                    <!-- <button class="btn btn-xs btn-warning" @click="saveRound">
                                        End & Save
                                    </button> -->
                                </span>
                                <span v-else class="text-white font-bold">
                                    Round #{{ round.id }}
                                    <button class="btn btn-xs btn-error" @click="deleteRound(round.id)">
                                        <!-- Slid black bin -->
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-4 h-4">
                                            <path fill-rule="evenodd" d="M6.5 3a1 1 0 0 1 1-1h5a1 1 0 0 1 1 1v1h2.25A2.25 2.25 0 0 1 16 7.25v10.5A2.25 2.25 0 0 1 13.75 20H6.25A2.25 2.25 0 0 1 4 17.75V7.25A2.25 2.25 0 0 1 6.25 5H8V3Zm3.5-1a2.5 2.5 0 0 0-2.5 2.5V5h5V4.5A2.5 2.5 0 0 0 10 .5ZM6.25 7A1.25 1.25 0 0 0 5 8.25v9.5c0 .69.56 1.25 1.25 1.25h7.5c.69 0 1.25-.56 1.25-1.25v-9.5A1.25 1.25 0 0 0 13.75 7H6.25Z" clip-rule="evenodd" />
                                        </svg>
                                    </button>
                                </span>
                            </div>
                        </th>
                    </tr>
                </thead>
                <tbody>
                    <tr class="border-0">
                        <td
                            v-for="round in [{ id: 'Overall', results: overall }, ...groupByTeam]"
                            :key="round.id"
                            class="p-0 align-top"
                        >
                            <div
                                v-for="result in Array.from(round.results.values())
                                .sort((a, b) => b.score - a.score)
                                .map((result, index) => ({ ...result, rank: index + 1 }))"
                                :key="`${round.id}-${result.teamName}-${result.rank}`"
                                class="w-40 p-1"
                            >
                                <div class="rounded-lg bg-neutral p-1 flex flex-row items-center justify-between gap-2">

                                    <!-- Rank -->
                                    <div class="px-1 text-lg font-bold shrink-0">
                                        {{ result.rank }}°
                                    </div>

                                    <!-- Team and Agent -->
                                    <div class="min-w-0 flex-1 overflow-hidden whitespace-nowrap">
                                        <!-- Team -->
                                        <div class="font-bold">
                                        {{ result.teamName?.length > 10
                                            ? result.teamName.slice(0, 4) + '...' + result.teamName.slice(-4)
                                            : result.teamName }}
                                        </div>
                                        <!-- Agents -->
                                        <Marquee class="text-neutral-content">
                                            <span v-for="a in result.agents">
                                                {{ a.name }}<span v-if="a.id!=a.name">({{a.id}})</span> +{{ a.score }} -{{ a.penalty }}
                                            </span>
                                        </Marquee>
                                    </div>

                                    <!-- Score -->
                                    <span class="text-error text-right text-lg font-bold shrink-0">
                                        {{ result.score }}
                                    </span>
                                </div>
                            </div>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
                
    </main>
</template>

<style>
</style>