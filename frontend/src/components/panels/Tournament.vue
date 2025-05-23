<script setup>
    
    import { computed, reactive, watch } from 'vue';

    import { connection } from '../../states/myConnection.js';
    import { tournament, overall, saveRound } from '@/states/myTournament.js';
    
    const grid = connection?.grid;

    watch( () => Array.from( connection?.grid.agents.values() ).map( a => a.score ), () => {
        const current = tournament[tournament.length - 1];
        if ( !current ) return;
        for ( const [id, agent] of grid.agents.entries() ) {
            let result = current.results.get(id);
            if (result) {
                result.score = agent.score;
            }
            else {
                current.results.set(id, {
                    name: agent.name,
                    score: agent.score
                });
            }
        }
    }, { immediate: true } );

</script>

<template>
    <main class="text-white">

        <div class="overflow-x-auto">
            <table class="table table-xs">
                <thead>
                    <tr>
                        <th v-for="round in tournament" class="font-bold">
                            Round #{{ round.id }}
                            <button v-if="round.status == 'active'" class="btn btn-xs btn-warning" @click="saveRound">
                                Save
                            </button>
                            <span v-else-if="round.status == 'done'">
                                ({{ round.status }})
                            </span>
                        </th>
                        <th class="text-green-500 font-bold">
                            Overall
                        </th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <th v-for="round in tournament">
                            <table class="table table-xs !w-40">
                                <tbody>
                                    <tr v-for="result in Array.from( round.results.values() ).sort((a,b)=>b.score-a.score).map((result, index) => ({...result, rank: index + 1}))">
                                        <th>{{ result.rank }}#</th>
                                        <th>
                                            {{ result.name?.length > 8 ? result.name.slice(0, 8) + '...' : result.name }}
                                            ({{ result.score }})
                                        </th>
                                    </tr>
                                </tbody>
                            </table>
                        </th>
                        <th>
                            <!-- Overall -->
                            <table class="table table-xs">
                                <tbody>
                                    <tr v-for="result in Array.from( overall.values() ).sort((a,b)=>b.score-a.score).map((result, index) => ({...result, rank: index + 1}))">
                                        <th>#{{ result.rank }}</th>
                                        <th>
                                            {{ result.name?.length > 8 ? result.name.slice(0, 8) + '...' : result.name }}
                                            ({{ result.score }})
                                        </th>
                                    </tr>
                                </tbody>
                            </table>
                        </th>
                    </tr>
                </tbody>
            </table>
        </div>
                
    </main>
</template>

<style>
</style>