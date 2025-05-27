<script setup>
    
    import { connection } from '../../states/myConnection.js';
    import { deleteAgent } from '../../apiClient.js';

    const admin = connection?.payload.role == 'admin';
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
                    <template v-if="agent.status != 'invalid'" >
                        <td class="p-0 pl-1 align-bottom">
                            <input type="checkbox" v-model="agent.selected" :checked="agent.selected.value" class="checkbox checkbox-info checkbox-sm" />
                        </td>
                        <td class="align-middle">
                            <div class="tooltip tooltip-info" :data-tip="`${agent.name}(${agent.id}) ${agent.teamName?agent.teamName+'('+agent.teamId+')':''}`">
                                <div class="flex flex-wrap place-content-center items-center max-w-28 overflow-hidden leading-none">
                                    <span v-if="agent.teamName" class="text-xs" :class="{ 'font-bold': agent.hoovered }">
                                        {{ agent.teamName?.length > 10 ? agent.teamName?.slice(0, 8) : agent.teamName }}...{{ agent.name?.length > 6 ? agent.name.slice(-4) : agent.name }}
                                    </span>
                                    <span v-else class="text-xs" :class="{ 'font-bold': agent.hoovered }">
                                        {{ agent.name?.length > 12 ? '...' + agent.name.slice(-10) : agent.name }}
                                    </span>
                                </div>
                            </div>
                        </td>
                        <td class="">
                            <div class="tooltip tooltip-info" :data-tip="agent.status">
                                <span class="font-mono text-xs" :class="{
                                    'text-green-500': agent.status == 'online',
                                    'text-yellow-500': agent.status == 'out of range',
                                    'text-red-500': agent.status == 'offline',
                                    'text-2xl': agent.id==connection.payload.id
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
                            <span class="text-lg text-white ml-1">
                                {{ agent.penalty }}
                            </span>
                        </td>
                    </template>
                </tr>
            </tbody>
        </table>

        <button class="m-1 btn btn-outline btn-error btn-sm" @click="deleteAgent(connection?.token, connection?.grid.selectedAgent.value.id)" v-if="admin" >
            Kick
        </button>

        <button class="m-1 btn btn-outline btn-error btn-sm" @click="respawn()" v-if="false" >
            Respawn
        </button>
        
        <button class="m-1 btn btn-outline btn-error btn-sm" @click="resetScore()" v-if="false" disabled >
            Reset score
        </button>
                
    </main>
</template>

<style>
</style>