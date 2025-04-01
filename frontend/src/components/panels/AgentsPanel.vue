<script setup>
    
    import { connection } from '../../states/myConnection.js';
    import { deleteAgent } from '../../apiClient.js';

    const grid = connection?.grid;

</script>

<template>
    <main class="">
        
        <table v-if="connection?.grid.agents.size > 0">
            <thead>
                <tr>
                    <th class="px-1"></th>
                    <th class="px-1">Agent</th>
                    <th class="px-1">Status</th>
                    <th class="px-1">Score</th>
                    <th class="px-1">Penalty</th>
                </tr>
            </thead>
            <tbody>
                <tr v-for="agent in Array.from( connection?.grid.agents.values() ).sort((a,b)=>b.score-a.score)"
                        class="text-center"
                        :class="{ 'change-bg-maybe': agent.id==grid.me.value.id }"
                        @mouseover="agent.hoovered=true"
                        @mouseleave="agent.hoovered=false"
                >
                    <template v-if="agent.status != 'soffline'" >
                        <td class="pt-1 pl-1">
                            <input type="checkbox" v-model="agent.selected" :checked="agent.selected.value" class="checkbox checkbox-info" />
                        </td>
                        <td class="">
                            <div class="tooltip tooltip-info" :data-tip="`${agent.name}(${agent.id}) ${agent.teamName?agent.teamName+'('+agent.teamId+')':''}`">
                                <div class="flex flex-wrap place-content-center items-center max-w-28 overflow-hidden leading-none">
                                    <span class="mx-1 text-sm font-mono" :class="{ 'font-bold': agent.hoovered }">
                                        {{ agent.name?.length > 10 ? agent.name.slice(0, 10) + '...' : agent.name }}
                                    </span>
                                    <span class="text-xs font-mono text-error" :class="{ 'font-bold': agent.hoovered }">
                                        {{ agent.teamName?.length > 10 ? agent.teamName?.slice(0, 10) + '...' : agent.teamName }}
                                    </span>
                                </div>
                            </div>
                        </td>
                        <td class="">
                            <div class="tooltip tooltip-info" :data-tip="agent.status">
                                <span class="font-mono text-sm" :class="{
                                    'text-green-500': agent.status == 'online',
                                    'text-yellow-500': agent.status == 'out of range',
                                    'text-red-500': agent.status == 'offline',
                                    'text-2xl': agent.id==grid.me.value.id
                                }">
                                    {{ agent.status == 'offline' ? '🔴' : agent.status == 'out of range' ? '🟡' : '🟢' }}
                                </span>
                            </div>
                        </td>
                        <td class="max-w-16">
                            <span class="text-xl text-white ml-1">
                                {{ agent.score }}
                            </span>
                        </td>
                        <td class="max-w-16">
                            <span class="text-xl text-white ml-1">
                                {{ agent.penalty }}
                            </span>
                        </td>
                    </template>
                </tr>
            </tbody>
        </table>

        <button class="m-1 btn btn-outline btn-error btn-sm" @click="deleteAgent(connection?.token, connection?.grid.selectedAgent.value.id)" >
            Kick
        </button>

        <button class="m-1 btn btn-outline btn-error btn-sm" @click="respawn()" disabled >
            Respawn
        </button>
        
        <button class="m-1 btn btn-outline btn-error btn-sm" @click="resetScore()" disabled >
            Reset score
        </button>
                
    </main>
</template>

<style>
</style>