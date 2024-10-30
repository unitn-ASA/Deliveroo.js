<script setup>
    
    import { onMounted, onUnmounted, ref } from 'vue';
    import Login from '../components/Login.vue';
    import Deliveroojs from '../components/Deliveroojs.vue';
    import Settings from '@/components/Settings.vue';
    import Timer from '@/components/Timer.vue';

    const config = ref(null); // Reactive variable for Deliveroojs config
    const clockms = ref(0);

    function setConfig(c) {
        config.value = c;
    }

    const isOverlayVisible = ref(false); // Reactive variable for overlay visibility
    const deliverooKey = ref(0); // Key for Deliveroojs component

    const toggleOverlay = () => {
        isOverlayVisible.value = !isOverlayVisible.value; // Toggle overlay visibility
    };

    const handleLogin = () => {
        isOverlayVisible.value = false; // Hide the overlay
        deliverooKey.value += 1; // Increment the key to force reload Deliveroojs
    };

</script>

<template>
    <main>

        <div :class="[
                isOverlayVisible ? 'bg-black bg-opacity-50' : 'opacity-0 pointer-events-none'
            ]"
            class="fixed z-20 top-0 bottom-0 right-0 left-0 backdrop-blur-md transition-all duration-300"
            ></div>
        <div v-show="isOverlayVisible" class="login-overlay">
            <div class="absolute w-full h-full pt-20">
                <div class="w-2/3 mx-auto pb-10 grid grid-flow-row space-y-4">
                    <div id="login-titlebar" class="z-30 flex items-center space-x-4 float-right w-full">
                        <div class="text-center text-xl bg-white/85 dark:bg-gray-700 rounded-lg py-2 flex-1 h-full">
                            Login / Signup
                        </div>
                        <button class="btn btn-square btn-error" @click="toggleOverlay">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6"
                            fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                    <div class="z-30 bg-white/85 dark:bg-gray-700 rounded-lg">
                        <Login @login="handleLogin"/>
                    </div>
                </div>
            </div>
        </div>

        <div id="dashboard" class="flex text-sm text-white">
            
            
            <div id="info" class="fixed z-10 left-0 top-4 max-h-full overflow-scroll" style="direction: rtl">
            <div class="resize" style="direction: ltr">

                <div class="flex flex-col space-y-4">
                    
                    <div tabindex="0" class="z-10 collapse collapse-arrow bg-neutral opacity-50 hover:opacity-90">
                        <input type="checkbox" />
                        <div class="collapse-title">
                            <span id="clock.frame"></span> <br>
                            <span id="clock.ms"></span> <br>
                            <span id="socket.id"></span> <br>
                            <span id="agent.id"></span> <br>
                            <span id="agent.name"></span> <br>
                            <span id="agent.team"></span> <br>
                            <span id="agent.xy"></span> <br>
                        </div>
                        <div class="collapse-content">
                            <Settings/>
                            <pre id="config" class="text-xs"></pre>
                            <img id="canvas" width="200" height="200" style="position: relative; top: 0; left: 0; z-index: 1000;"></img>
                        </div>
                    </div>

                    <div class="z-10 collapse collapse-arrow w-80 bg-neutral opacity-50 hover:opacity-90">
                        <input type="checkbox" checked="checked"/>
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

                    
                    <Timer class="z-10" :timer="clockms"/>
                    
                    <div class="z-10 grid grid-flow-col gap-5 text-center">
                        <button class="btn btn-info btn-sm" @click="toggleOverlay">Login</button>
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
                        <div class="collapse-title font-medium">Logs</div>
                        <div id="logs" class="collapse-content overflow-auto" style="min-height:auto!important"></div>
                    </div>
                    
                </div>
            </div>
            
        </div>

        <Deliveroojs :key="deliverooKey" @clockms="(v)=>clockms=v"/> <!-- Use the key to force reload -->

    </main>
</template>

<style>
</style>