<script setup>
    
    import { ref, computed } from 'vue';
    import { connection } from '../../states/myConnection.js';
    import { deleteAgent } from '../../apiClient.js';

    const grid = connection?.grid;

</script>

<template>
    <main>
        
        <table>
            <thead>
                <tr>
                    <th></th>
                    <th>Agent</th>
                    <th>Team</th>
                    <th>Status</th>
                    <th class="px-2">Score</th>
                    <th class="px-2">Penalty</th>
                </tr>
            </thead>
            <tbody>
                <tr v-for="[key, agent] in connection?.grid.agents.entries()" class="text-center" @mouseover="agent.hoovered=true" @mouseleave="agent.hoovered=false">
                    <template v-if="agent.status != 'offline'">
                        <td class="px-1">
                            <input type="checkbox" v-model="agent.selected" :checked="agent.selected.value" class="checkbox checkbox-info" />
                        </td>
                        <td class="px-1">
                            <div class="tooltip" :data-tip="agent.id">
                                <span class="font-mono text-sm mx-auto" :class="{ 'font-medium': agent.selected, 'font-bold': agent.hoovered }">
                                    {{ agent.name }}
                                </span>
                            </div>
                        </td>
                        <td class="px-1">
                            <div class="tooltip" :data-tip="agent.teamId">
                                <span class="font-mono text-sm mx-auto" :class="{ 'font-medium': agent.selected }">
                                    {{ agent.teamName }}
                                </span>
                            </div>
                        </td>
                        <td class="px-1">
                            <div class="tooltip" :data-tip="agent.status">
                                <span class="font-mono text-sm mx-auto" :class="{
                                    'text-green-500': agent.status == 'online',
                                    'text-yellow-500': agent.status == 'out of range',
                                    'text-red-500': agent.status == 'offline'
                                }">
                                    {{ agent.status == 'offline' ? '🔴' : agent.status == 'out of range' ? '🟡' : agent.id==grid.me.value.id ? "-" : '🟢' }}
                                </span>
                            </div>
                        </td>
                        <td class="">
                            <span class="text-2xl text-white ml-1">
                                {{ agent.score }}
                            </span>
                        </td>
                        <td class="">
                            <span class="text-2xl text-white ml-1">
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
        <table>
            <tbody>
                <tr v-for="[key, agent] in connection?.grid.agents.entries()" class="text-center">
                    <template v-if="agent.status == 'offline'">
                        <td class="w-6">
                        </td>
                        <td class="px-1">
                            <div class="tooltip" :data-tip="agent.id">
                                <span class="font-mono text-sm mx-auto" :class="{ 'font-medium': agent.selected }">
                                    {{ agent.name }}
                                </span>
                            </div>
                        </td>
                        <td class="px-1">
                            <div class="tooltip" :data-tip="agent.teamId">
                                <span class="font-mono text-sm mx-auto">
                                    {{ agent.teamName || '-' }}
                                </span>
                            </div>
                        </td>
                        <td class="px-1">
                            <div class="tooltip" :data-tip="agent.status">
                                <span class="font-mono text-sm mx-auto" :class="{
                                    'text-green-500': agent.status == 'online',
                                    'text-yellow-500': agent.status == 'out of range',
                                    'text-red-500': agent.status == 'offline'
                                }">
                                    {{ agent.status == 'offline' ? '🔴' : agent.status == 'out of range' ? '🟡' : agent.id==grid.me.value.id ? "-" : '🟢' }}
                                </span>
                            </div>
                        </td>
                        <td class="px-1">
                            <span class="text-2xl text-white ml-1">
                                {{ agent.score }}
                            </span>
                        </td>
                    </template>
                </tr>
            </tbody>
        </table>
                
    </main>
</template>

<style>
</style>