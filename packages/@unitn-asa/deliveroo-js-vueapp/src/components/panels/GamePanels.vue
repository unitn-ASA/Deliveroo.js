<script setup>
    
    import { ref, computed } from 'vue';
    import Settings from './Settings.vue';
    import Timer from './Timer.vue';
    import Maps from '../modals/Maps.vue';
    import Modal from '../modals/Modal.vue';
    import Login from '../modals/Login.vue';
    import { connection } from '../../states/myConnection.js';
    import AgentsPanels from './AgentsPanels.vue';

    const mapsModal = ref(false); // Reactive variable for overlay visibility
    const loginModal = ref(!connection); // Reactive variable for overlay visibility

    const grid = connection?.grid;
    const me = grid?.me;
    const clock = grid?.clock;
    const selectedAgent = grid?.selectedAgent;
    const selectedTile = grid?.selectedTile;
    const selectedParcel = computed ( () => connection?.grid?.selectedParcel.value );

    function change() {
        connection.socket.emit( 'tile', selectedTile.value.x, selectedTile.value.y );
    }

    function removeParcel(parcel) {
        // console.log('removeParcel', parcel.id);
        connection.socket.emit( 'dispose parcel', parcel.id );
    }

</script>

<template>
    <main>

        <Modal v-model="loginModal" title="Login / Signup">
            <Login/>
        </Modal>

        <Modal v-model="mapsModal" title="Change map">
            <Maps @load-map="mapsModal=false;"/>
        </Modal>

        <div id="dashboard" class="flex text-sm text-white">
            
            
            <div id="info" class="fixed z-10 left-0 top-4 max-h-full overflow-scroll" style="direction: rtl">
            <div class="resize" style="direction: ltr">

                <div class="flex flex-col space-y-4">
                    
                    <div tabindex="0" class="z-10 collapse collapse-arrow bg-neutral opacity-50 hover:opacity-90">
                        <input type="checkbox" />
                        <div class="collapse-title">
                            <span id="clock.frame"></span>clock.frame {{clock?.frame}}<br>
                            <span id="clock.ms"></span>clock.ms {{clock?.ms}}<br>
                            <span id="socket.id"></span>socket.id {{connection?.socket.id}}<br>
                            <span id="agent.id"></span>agent.id {{me?.id}}<br>
                            <span id="agent.name"></span>agent.name {{me?.name}}<br>
                            <span id="agent.teamId"></span>agent.team {{me?.teamId}}<br>
                            <span id="agent.teamName"></span>agent.team {{me?.teamName}}<br>
                            <span id="agent.xy"></span>agent.xy {{me?.x}} {{me?.y}}<br>
                            <span id="grid"></span>grid {{grid?.width}}x{{grid?.height}}<br>
                        </div>
                        <div class="collapse-content">
                            <button 
                                class="flex-none btn btn-outline btn-error btn-xs w-full" 
                                @click="mapsModal=true;"
                            >
                                Change map
                            </button>
                            <Settings v-if="connection"/>
                            <pre id="config" class="text-xs"></pre>
                            <img id="canvas" width="200" height="200" style="position: relative; top: 0; left: 0; z-index: 1000;"></img>
                        </div>
                    </div>

                    <div class="z-10 collapse collapse-arrow w-80 bg-neutral opacity-50 hover:opacity-90">
                        <input type="checkbox" checked />
                        <div class="collapse-title font-medium">Agents</div>
                        <div class="collapse-content overflow-hidden" style="min-height:auto!important">

                            <AgentsPanels/>

                            <!-- <table>
                                <thead>
                                    <tr>
                                        <th></th>
                                        <th>Agent</th>
                                        <th>Team</th>
                                        <th>Status</th>
                                        <th class="px-2">Score</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr v-for="[key, agent] in connection?.grid.agents.entries()" class="text-center">
                                        <template v-if="agent.status != 'offline'">
                                            <td class="p-1">
                                                <input type="checkbox" v-model="agent.selected" :checked="agent.selected.value" class="checkbox checkbox-info" />
                                            </td>
                                            <td class="p-1">
                                                <div class="tooltip" :data-tip="agent.id">
                                                    <span class="font-mono text-sm mx-auto" :class="{ 'font-medium': agent.selected }">
                                                        {{ agent.name }}
                                                    </span>
                                                </div>
                                            </td>
                                            <td class="p-1">
                                                <div class="tooltip" :data-tip="agent.teamId">
                                                    <span class="font-mono text-sm mx-auto" :class="{ 'font-medium': agent.selected }">
                                                        {{ agent.teamName }}
                                                    </span>
                                                </div>
                                            </td>
                                            <td class="p-1">
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
                                        </template>
                                    </tr>
                                </tbody>
                            </table>
                            <button class="m-1 btn btn-outline btn-error btn-sm" @click="kick()">
                                Kick
                            </button>
                            <button class="m-1 btn btn-outline btn-error btn-sm" @click="respawn()">
                                Respawn
                            </button>
                            <button class="m-1 btn btn-outline btn-error btn-sm" @click="resetScore()">
                                Reset score
                            </button> -->
                        </div>
                    </div>

                    <div class="z-10 collapse collapse-arrow w-80 bg-neutral opacity-50 hover:opacity-90">
                        <input type="checkbox" checked />
                        <div class="collapse-title font-medium">Parcels ({{ connection?.grid.parcels.size }} of a maximum of {{ connection?.configs.PARCELS_MAX }})</div>
                        <div class="collapse-content overflow-hidden" style="min-height:auto!important">

                            <table>
                                <thead>
                                    <tr>
                                        <th class="px-2"></th>
                                        <th class="px-2">Parcel</th>
                                        <th class="px-2">Reward</th>
                                        <th class="px-2"></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr v-for="[key, parcel] in connection?.grid.parcels.entries()" class="text-center">
                                        <td class="p-0">
                                            <input type="checkbox" :checked="parcel.selected" class="checkbox checkbox-info" />
                                        </td>
                                        <td>
                                            <div class="tooltip" :data-tip="parcel.x+','+parcel.y">
                                                <span class="font-mono text-sm mx-auto" :class="{ 'font-medium': parcel.selected }">
                                                    {{ parcel.id }}
                                                </span>
                                            </div>
                                        </td>
                                        <td>
                                            <span class="text-xl text-white ml-1">
                                                {{ parcel.reward }}
                                            </span>
                                        </td>
                                        <td>
                                            <button class="btn btn-outline btn-error btn-xs" @click="removeParcel(parcel)">
                                                X
                                            </button>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                            <!-- <div v-for="[key, parcel] in connection.grid.parcels.entries()" >
                                <div class="flex flex-row space-x-2 space-y-2">
                                    <input type="checkbox" :checked="parcel.selected" class="checkbox checkbox-info" />
                                    <span>{{ parcel.id }}({{ parcel.x }}, {{ parcel.y }})</span>
                                    <span>{{ parcel.reward }}</span>
                                </div>
                            </div> -->
                        </div>
                    </div>

                    <div class="z-10 collapse collapse-arrow w-80 bg-neutral opacity-50 hover:opacity-90">
                        <input type="checkbox" checked />
                        <div class="collapse-title font-medium">Tools</div>
                        <div class="collapse-content overflow-hidden" style="min-height:auto!important">
                            <button class="m-1 btn btn-outline btn-info btn-sm" @click="selectionTool()">
                                Drag
                            </button>
                            <button class="m-1 btn btn-outline btn-info btn-sm" @click="selectionTool()">
                                Select
                            </button>
                            <!-- <span>
                                Inspect
                            </span> -->
                            <br>
                            <span>
                                Tile in ({{ selectedTile?.x }}, {{ selectedTile?.y }})
                                <div class="tooltip" data-tip="Click to change type">
                                    <button v-if="selectedTile" class="btn btn-outline btn-error btn-sm" @click="change()">
                                        Type {{ selectedTile?.type }}
                                    </button>
                                </div>
                            </span>
                            <br>
                            <span>
                                Agent in ({{ selectedAgent?.x }}, {{ selectedAgent?.y }})
                                is {{ selectedAgent?.name}} ( {{ selectedAgent?.id}} )
                            </span>
                            <br>
                            <span>
                                Parcel in ({{ selectedParcel?.x }}, {{  selectedParcel?.y }})
                                is {{ selectedParcel?.id }} with reward {{ selectedParcel?.reward }}
                            </span><br>
                        </div>
                    </div>
                
                </div>

            </div>
            </div>

            <div id="right-colum" class="fixed z-10 w-80 right-4 top-4 max-h-full overflow-hidden">
                <div class="flex flex-col h-full rounded-lg space-y-4">

                    
                    <Timer class="z-10" :timer="clock?.ms"/>
                    
                    <div class="z-10 grid grid-flow-col gap-5 text-center">
                        <button class="btn btn-info btn-sm" @click="loginModal=true">Login</button>
                        <button class="btn btn-info btn-sm" @click="">...</button>
                        <button class="btn btn-info btn-sm" @click="">...</button>
                        <button class="btn btn-info btn-sm" @click="">...</button>
                    </div>
                    
                    <div class="z-10 collapse collapse-arrow bg-neutral opacity-50 hover:opacity-90 min-h-16 max-h-64">
                        <input type="checkbox"/>
                        <div class="collapse-title font-medium">Chat</div>
                        <div id="chat" class="collapse-content overflow-auto" style="min-height:auto!important"></div>
                    </div>
                    
                    <div class="z-10 collapse collapse-arrow bg-neutral opacity-50 hover:opacity-90 min-h-16 max-h-96">
                        <input type="checkbox" />
                        <div class="collapse-title font-medium">
                            Server Logs <br/>
                            <div class="text-xs pb-2">
                                {{ connection?.serverLogs[connection.serverLogs.length-1]?.message.join(" ") }} <br/>
                            </div>
                        </div>
                        <div id="logs" class="collapse-content overflow-auto" style="min-height:auto!important">
                            <div v-for="{timestamp, message} of connection?.serverLogs" class="text-xs pb-2">
                                <span v-for="m of message"> {{ m }} </span>
                                <br/>
                            </div>
                        </div>
                    </div>
                    
                </div>
            </div>
            
        </div>

    </main>
</template>

<style>
</style>