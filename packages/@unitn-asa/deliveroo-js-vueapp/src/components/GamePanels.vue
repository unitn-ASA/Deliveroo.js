<script setup>
    
    import { onMounted, onUnmounted, ref, inject, computed } from 'vue';
    import Settings from '@/components/Settings.vue';
    import Timer from '@/components/Timer.vue';

    const emit = defineEmits(['login']); // Define the emit for login

    function login () {
        emit('login');
    }

    /** @type {import("vue").Ref<import("@/Connection").Connection>} */
    const connection = inject( "connection" );

    // compute me with Vue computed
    const me = computed( () => connection.value.grid.me );
    
    const clock = connection.value.grid.clock;
    
</script>

<template>
    <main>

        <div id="dashboard" class="flex text-sm text-white">
            
            
            <div id="info" class="fixed z-10 left-0 top-4 max-h-full overflow-scroll" style="direction: rtl">
            <div class="resize" style="direction: ltr">

                <div class="flex flex-col space-y-4">
                    
                    <div tabindex="0" class="z-10 collapse collapse-arrow bg-neutral opacity-50 hover:opacity-90">
                        <input type="checkbox" />
                        <div class="collapse-title">
                            <span id="clock.frame"></span>clock.frame {{clock.frame}}<br>
                            <span id="clock.ms"></span>clock.ms {{clock.ms}}<br>
                            <span id="socket.id"></span>socket.id {{connection.socket.id}}<br>
                            <span id="agent.id"></span>agent.id {{me?.id}}<br>
                            <span id="agent.name"></span>agent.name {{me?.name}}<br>
                            <span id="agent.teamId"></span>agent.team {{me?.teamId}}<br>
                            <span id="agent.teamName"></span>agent.team {{me?.teamName}}<br>
                            <span id="agent.xy"></span>agent.xy {{me?.x}} {{me?.y}}<br>
                        </div>
                        <div class="collapse-content">
                            <Settings/>
                            <pre id="config" class="text-xs"></pre>
                            <img id="canvas" width="200" height="200" style="position: relative; top: 0; left: 0; z-index: 1000;"></img>
                        </div>
                    </div>

                    <div class="z-10 collapse collapse-arrow w-80 bg-neutral opacity-50 hover:opacity-90">
                        <input type="checkbox" checked />
                        <div class="collapse-title font-medium">Settings</div>
                        <div class="collapse-content overflow-hidden" style="min-height:auto!important">
                            <Settings/>
                        </div>
                    </div>
                
                </div>

            </div>
            </div>

            <div id="right-colum" class="fixed z-10 w-80 right-4 top-4 max-h-full overflow-hidden">
                <div class="flex flex-col h-full rounded-lg space-y-4">

                    
                    <Timer class="z-10" :timer="clock.ms"/>
                    
                    <div class="z-10 grid grid-flow-col gap-5 text-center">
                        <button class="btn btn-info btn-sm" @click="login">Login</button>
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
                                {{ connection.serverLogs[connection.serverLogs.length-1]?.message.join(" ") }} <br/>
                            </div>
                        </div>
                        <div id="logs" class="collapse-content overflow-auto" style="min-height:auto!important">
                            <div v-for="{timestamp, message} of connection.serverLogs" class="text-xs pb-2">
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