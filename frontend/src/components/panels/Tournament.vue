<script setup>
    
    import { computed, reactive, watch } from 'vue';

    import { connection } from '../../states/myConnection.js';
    import { tournament, goupByTeam, overall, saveRound, deleteRound } from '@/states/myTournament.js';
    
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
                    console.log('Adding new result for agent', id, agent);
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

        <div class="overflow-x-auto" style="">
            <table class="table table-xs">
                <thead>
                    <tr class="border-0">
                        <th v-for="round in tournament">
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
                        </th>
                        <th class="text-green-500 font-bold">
                            Overall
                        </th>
                    </tr>
                </thead>
                <tbody>
                    <tr class="border-0">
                        <td v-for="round in [...goupByTeam, {id:'Overall',results:overall}]" class="p-0 align-top">
                            <!-- Round # -->
                            <table class="table table-sm w-40">
                                <tbody>
                                    <tr class="border-0" v-for="result in Array.from( round.results.values() ).sort((a,b)=>b.score-a.score).map((result, index) => ({...result, rank: index + 1}))">
                                        <th class="px-1">{{ result.rank }}°</th>
                                        <th class="p-0 w-full text-nowrap">
                                            {{ result.teamName?.length > 10 ? result.teamName.slice(0, 8) + '...' : result.teamName }}
                                            <span class="text-error text-right">
                                                {{ result.score }}
                                            </span>
                                            <br/>
                                            <span v-for="a in result.agents">
                                                <span class="badge badge-xs badge-info">{{ a.name?.length > 4 ? '...' + a.name.slice(-4) : a.name }}</span>
                                            </span>
                                        </th>
                                    </tr>
                                </tbody>
                            </table>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
                
    </main>
</template>

<style>
</style>