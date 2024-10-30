<script setup>
    
    import { Game } from '../deliveroo/Game.js';
    import { user } from '../states/user.js';
    import { onMounted, onUnmounted, ref } from 'vue';
    
    const emit = defineEmits(['config', 'clockms'])

    var game;

    onMounted(() => {
        if ( user && user.value ) {
            const token = user.value.token;
            console.log('Deliveroojs.vue onMounted() Using token:', token)
            game = new Game( { token } );

            // Ascolta gli eventi dall'istanza di Game e emetti eventi Vue
            game.on('config', (data) => {
                emit('config', data);
            });

            game.on('clock.ms', (data) => {
                // console.log( 'clockms', data )
                emit('clockms', data);
            });
        }
    })

    onUnmounted(() => {
        if ( game )
            game.destroy();
    })

</script>

<template>
    <main>
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