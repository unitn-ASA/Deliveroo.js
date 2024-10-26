<script setup>
    
    import { Game } from '../deliveroo/Game.js';
    import { user } from '../states/user.js';
    import { onMounted, onUnmounted, ref } from 'vue';

    var game;

    onMounted(() => {
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