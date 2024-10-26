<script setup>
    
    import { Game } from '../deliveroo/Game.js';
    import { user } from '../states/user.js';
    import { onMounted, onUnmounted, ref } from 'vue';
    import Login from '../components/Login.vue';

    var game;
    const isOverlayVisible = ref(false); // Reactive variable for overlay visibility

    const toggleOverlay = () => {
        isOverlayVisible.value = !isOverlayVisible.value; // Toggle overlay visibility
    };

    onMounted(() => {
        // const roomId = route.params?.id || 0;
        if ( user && user.value ) {
            const token = user.value.token;
            console.log('GameView deliveroo token:', token)
            game = new Game( { token } );
        }
    })

    onUnmounted(() => {
        if ( game )
            game.destroy();
    })

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
                        <div class="text-center text-xl bg-white rounded-lg py-2 flex-1 h-full">
                            Login / Signup
                        </div>
                        <button class="btn btn-square btn-error" @click="toggleOverlay">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6"
                            fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                    <div class="z-30 bg-white rounded-lg">
                        <Login/>
                    </div>
                </div>
            </div>
        </div>

        <div id="dashboard" class="flex text-sm text-white">
            
            
            <div id="info" class="fixed z-10 left-0 top-4 bottom-4 overflow-scroll" style="direction: rtl">
                <div class="resize" style="direction: ltr">
                    
                    <div tabindex="0" class="z-10 collapse collapse-arrow bg-neutral opacity-50 hover:opacity-90">
                        <input type="checkbox"/>
                        <div class="collapse-title">
                            <span id="socket.id"></span> <br>
                            <span id="agent.id"></span> <br>
                            <span id="agent.name"></span> <br>
                            <span id="agent.team"></span> <br>
                            <span id="agent.xy"></span> <br>
                        </div>
                        <div class="collapse-content">
                            <pre id="config" class="text-xs"></pre>
                            <img id="canvas" width="200" height="200" style="position: relative; top: 0; left: 0; z-index: 1000;"></img>
                        </div>
                    </div>
                
                </div>
            </div>

            <div id="right-colum" class="fixed z-10 w-80 right-4 top-4 bottom-4 overflow-hidden">
                <div class="flex flex-col h-full rounded-lg space-y-4">

                    
                    <div class="z-10 grid grid-flow-col gap-5 text-center">
                        <div class="bg-neutral rounded-box text-neutral-content flex flex-col p-2">
                            <span class="countdown font-mono text-3xl mx-auto">
                                <span style="--value:15;"></span>
                            </span>
                            days
                        </div>
                        <div class="bg-neutral rounded-box text-neutral-content flex flex-col p-2">
                            <span class="countdown font-mono text-3xl mx-auto">
                                <span style="--value:10;"></span>
                            </span>
                            hours
                        </div>
                        <div class="bg-neutral rounded-box text-neutral-content flex flex-col p-2">
                            <span class="countdown font-mono text-3xl mx-auto">
                                <span style="--value:24;"></span>
                            </span>
                            min
                        </div>
                        <div class="bg-neutral rounded-box text-neutral-content flex flex-col p-2">
                            <span class="countdown font-mono text-3xl mx-auto">
                                <span style="--value:${counter};"></span>
                            </span>
                            sec
                        </div>
                    </div>
                    
                    <div class="z-10 grid grid-flow-col gap-5 text-center">
                        <button class="btn btn-info btn-sm" @click="toggleOverlay">Login</button>
                        <button class="btn btn-info btn-sm" @click="">...</button>
                        <button class="btn btn-info btn-sm" @click="">...</button>
                        <button class="btn btn-info btn-sm" @click="">...</button>
                    </div>
                    
                    <div class="z-10 collapse collapse-arrow bg-neutral opacity-50 hover:opacity-90 min-h-16 max-h-64">
                        <input type="checkbox" />
                        <div class="collapse-title font-medium">Chat</div>
                        <div class="collapse-content">
                            <p>hello</p>
                        </div>
                    </div>
                    
                    <div class="z-10 collapse collapse-arrow bg-neutral opacity-50 hover:opacity-90 min-h-16 max-h-96">
                        <input type="checkbox" />
                        <div class="collapse-title font-medium">Logs</div>
                        <div class="collapse-content overflow-auto" style="min-height:auto!important">
                            <p>hello</p> <p>hello</p> <p>hello</p> <p>hello</p> <p>hello</p> <p>hello</p> <p>hello</p> <p>hello</p> <p>hello</p> <p>hello</p> <p>hello</p> <p>hello</p> <p>hello</p> <p>hello</p> <p>hello</p> <p>hello</p> <p>hello</p> <p>hello</p> <p>hello</p> <p>hello</p> <p>hello</p> <p>hello</p> <p>hello</p> <p>hello</p> <p>hello</p> <p>hello</p> <p>hello</p> <p>hello</p> <p>hello</p> <p>hello</p> <p>hello</p> <p>hello</p> <p>hello</p> <p>hello</p> <p>hello</p> <p>hello</p> <p>hello</p> <p>hello</p> <p>hello</p> <p>hello</p> <p>hello</p> <p>hello</p>
                        </div>
                    </div>
                    
                </div>
            </div>
            
        </div>
        
        <div id="threejs" class="fixed"></div>

    </main>
</template>

<style>

    .label {
        color: #FFF;
        font-family: sans-serif;
        padding: 2px;
        background: rgba( 0, 0, 0, .6 );
        font-size: '12pt';
    }

</style>