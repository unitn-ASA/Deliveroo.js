<script setup>

    import { computed, ref } from 'vue';
    import { connection } from '../../states/myConnection.js';
    import api from '../../utils/api.js';

    const admin = connection?.payload.role == 'admin';
    const grid = connection?.grid;

    // Team groups: agents sharing a teamId group together, teamless agents
    // stand alone. Teams are ordered by total team score, members by
    // individual score
    const groupedAgents = computed( () => {

        const teams = new Map();
        const singles = [];

        for ( const agent of connection.grid.agents.values() ) {
            if ( agent.status == 'invalid' ) continue;
            if ( agent.teamId && agent.teamId != 'unknown' ) {
                let team = teams.get( agent.teamId );
                if ( ! team ) {
                    team = { key: agent.teamId, name: agent.teamName ?? agent.teamId, badge: true, agents: [] };
                    teams.set( agent.teamId, team );
                }
                team.agents.push( agent );
            } else {
                singles.push( { key: `solo-${agent.id}`, name: agent.name, badge: false, agents: [ agent ] } );
            }
        }

        const groups = [ ...teams.values(), ...singles ];
        for ( const group of groups ) {
            group.agents.sort( ( a, b ) => b.score - a.score );
            // -1 is the "never sensed" sentinel, not a real score
            group.total = group.agents.reduce( ( sum, { score } ) => sum + Math.max( 0, score ), 0 );
        }
        return groups.sort( ( a, b ) => b.total - a.total );

    } );

    // Verbatim latest sensing entry, exactly as the agent receives it on
    // the wire ({} when never sensed): students read the field names they
    // will use in their own agents
    const sensingTip = ( agent ) => JSON.stringify( agent.lastSensing ?? {}, null, 2 );

    // Status dot tooltip: state plus how fresh the sensing info is
    const statusTip = ( agent ) => {
        const seen = agent.lastSeenAt ? Math.max( 0, Math.round( ( Date.now() - agent.lastSeenAt ) / 1000 ) ) + 's fa' : 'mai';
        return `${agent.status} · visto ${seen}`;
    };

    // Teleported tooltip: fixed-positioned on <body> so it can overflow the
    // panels column (whose collapse-content overflow-hidden and scroll
    // wrapper would clip any CSS-native DaisyUI tooltip), like the LevelCard
    // tooltips which are only clipped by the fullscreen modal overlay
    const tip = ref(null);

    const tipStyle = computed( () => {
        if ( ! tip.value ) return {};
        const { x, y, placeLeft } = tip.value;
        return placeLeft
            ? { right: ( window.innerWidth - x ) + 'px', top: y + 'px', transform: 'translateY(-50%)' }
            : { left: x + 'px', top: y + 'px', transform: 'translateY(-50%)' };
    } );

    function openTip ( event, agent ) {
        const rect = event.currentTarget.getBoundingClientRect();
        // Prefer right of the cell, flip to the left side when off-screen
        let placeLeft = false;
        let x = rect.right + 8;
        if ( x + 280 > window.innerWidth ) {
            x = rect.left - 8;
            placeLeft = true;
        }
        // Keep the (tall) bubble vertically inside the viewport
        const y = Math.max( 100, Math.min( window.innerHeight - 100, rect.top + rect.height / 2 ) );
        tip.value = { x, y, placeLeft, agent };
    }

    function closeTip () {
        tip.value = null;
    }

</script>

<template>
    <main class="">

        <table v-if="connection?.grid.agents.size > 0" class="w-full table-fixed">
            <colgroup>
                <col>
                <col class="w-16">
            </colgroup>
            <tbody v-for="group in groupedAgents" :key="group.key">
                <tr :class="{ 'opacity-60': ! group.badge }">
                    <td class="px-1 pt-1 text-left overflow-hidden">
                        <span v-if="group.badge" class="badge badge-sm badge-ghost max-w-full">
                            <span class="truncate min-w-0">
                                {{ group.name }}<span v-if="group.name != group.key" class="opacity-50">({{ group.key }})</span>
                            </span>
                        </span>
                        <span v-else class="text-xs inline-block max-w-full truncate align-bottom">{{ group.name }}</span>
                    </td>
                    <td class="px-1 pt-1 text-right font-mono text-xs text-white/80">{{ group.total }}</td>
                </tr>
                <tr v-for="agent in group.agents"
                        class="text-center cursor-pointer"
                        :class="{
                            'change-bg-maybe': agent.id == grid.me.value?.id,
                            'bg-info/20': agent.selected
                        }"
                        @click="agent.selected = !agent.selected"
                        @mouseover="agent.hoovered=true"
                        @mouseleave="agent.hoovered=false"
                >
                    <td class="align-middle" :class="group.badge && 'pl-4 border-l border-base-content/10'">
                        <div class="flex items-center justify-start gap-1 leading-none">
                            <div class="tooltip tooltip-right tooltip-info" :data-tip="statusTip(agent)">
                                <span class="font-mono text-xs" :class="{
                                    'text-green-500': agent.status == 'online',
                                    'text-yellow-500': agent.status == 'out of range',
                                    'text-red-500': agent.status == 'offline' || agent.status == 'lost',
                                    'text-lg': agent.id==connection.payload.id
                                }">
                                    {{ agent.status == 'offline' || agent.status == 'lost' ? '🔴' : agent.status == 'out of range' ? '🟡' : '🟢' }}
                                </span>
                            </div>
                            <div class="min-w-0"
                                @mouseenter="openTip($event, agent)"
                                @mouseleave="closeTip()">
                                <span class="block text-xs truncate">
                                    <span class="font-bold text-white">{{ agent.name }}</span>
                                    <span class="text-white/50">({{ agent.id }})</span>
                                </span>
                            </div>
                        </div>
                    </td>
                    <td class="whitespace-nowrap text-left px-1">
                        <span class="text-base font-semibold text-white">
                            {{ agent.score }}
                        </span>
                    </td>
                </tr>
            </tbody>
        </table>

        <button class="m-1 btn btn-outline btn-error btn-sm" @click="api.deleteAgent(connection?.token, connection?.grid.selectedAgent.value.id)" v-if="admin" >
            Kick
        </button>

        <button class="m-1 btn btn-outline btn-error btn-sm" @click="api.patchAgent(connection?.token, connection?.grid.selectedAgent.value.id, {score:0, attributes:{warnings:0}})" v-if="admin" >
            Reset
        </button>

        <Teleport to="body">
            <div v-if="tip"
                class="fixed z-[9999] max-w-xs px-3 py-2 rounded-lg bg-info text-info-content text-xs font-mono whitespace-pre-wrap shadow-lg pointer-events-none"
                :style="tipStyle">
                {{ sensingTip(tip.agent) }}
            </div>
        </Teleport>

    </main>
</template>

<style>
</style>
