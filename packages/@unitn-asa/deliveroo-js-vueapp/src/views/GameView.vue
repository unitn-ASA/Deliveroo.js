<script setup>
    
    import { Game } from '../deliveroo/Game.js';
    import { user } from '../states/user.js';
    import { onMounted, onUnmounted, onBeforeUpdate, onUpdated, onBeforeMount, onBeforeUnmount } from 'vue';

    var game;

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

        <div id="dashboard" class="block text-sm text-white">
            
            
            <div id="info" class="absolute left-0 top-4 bottom-4 z-10 overflow-scroll" style="direction: rtl">
                <div class="resize" style="direction: ltr">
                    
                    <div tabindex="0" class="collapse collapse-arrow bg-neutral opacity-50 hover:opacity-90">
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

            <div id="right-colum" class="absolute z-10 w-80 right-0 top-4 bottom-6 overflow-scroll rounded-lg space-y-4">


                <div class="grid auto-cols-max grid-flow-col gap-5 text-center">
                    <div class="bg-neutral rounded-box text-neutral-content flex flex-col p-2">
                        <span class="countdown font-mono text-3xl">
                        <span style="--value:15;"></span>
                        </span>
                        days
                    </div>
                    <div class="bg-neutral rounded-box text-neutral-content flex flex-col p-2">
                        <span class="countdown font-mono text-4xl">
                        <span style="--value:10;"></span>
                        </span>
                        hours
                    </div>
                    <div class="bg-neutral rounded-box text-neutral-content flex flex-col p-2">
                        <span class="countdown font-mono text-4xl">
                        <span style="--value:24;"></span>
                        </span>
                        min
                    </div>
                    <div class="bg-neutral rounded-box text-neutral-content flex flex-col p-2">
                        <span class="countdown font-mono text-4xl">
                        <span style="--value:${counter};"></span>
                        </span>
                        sec
                    </div>
                </div>

                <div class="collapse collapse-arrow bg-neutral opacity-50 hover:opacity-90">
                    <input type="checkbox" />
                    <div class="collapse-title font-medium">Chat</div>
                    <div class="collapse-content">
                        <p>hello</p>
                    </div>
                </div>

                <div class="collapse collapse-arrow bg-neutral opacity-50 hover:opacity-90">
                    <input type="checkbox" />
                    <div class="collapse-title font-medium">Logs</div>
                    <div class="collapse-content">
                        <p>hello</p> <p>hello</p> <p>hello</p> <p>hello</p> <p>hello</p> <p>hello</p> <p>hello</p> <p>hello</p> <p>hello</p> <p>hello</p> <p>hello</p> <p>hello</p> <p>hello</p> <p>hello</p> <p>hello</p> <p>hello</p> <p>hello</p> <p>hello</p> <p>hello</p> <p>hello</p> <p>hello</p> <p>hello</p> <p>hello</p> <p>hello</p> <p>hello</p> <p>hello</p> <p>hello</p> <p>hello</p> <p>hello</p> <p>hello</p> <p>hello</p> <p>hello</p> <p>hello</p> <p>hello</p> <p>hello</p> <p>hello</p> <p>hello</p> <p>hello</p> <p>hello</p> <p>hello</p> <p>hello</p> <p>hello</p>
                    </div>
                </div>

            </div>
            
        </div>
        
        <div id="threejs"></div>

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