<script setup>
    import VersionPanel from '@/components/panels/VersionPanel.vue';
import { ref, provide } from 'vue';
    import { useRouter } from 'vue-router';

    const router = useRouter();

</script>

<template>

    <main class="w-3/4 m-auto bg-slate-200 min-h-screen" >

        <div class="pt-20 px-20 pb-10">

            <h1 class="p-5 text-xl">Deliveroo.js</h1>
            
            Deliveroo.js it's an Educational Game, developed by Marco Robol for the course on Autonomous Software Agents (ASA) by Prof. Paolo Giorgini.
            <br/>
            It is a Grid-Based parcel collection videogame. You can play in Multi-Player from your browser or develop your own Autonomous Agent that plays in your place.

            <h2 class="p-5 text-m">How to play</h2>
            
            Play online from your browser at <a href="https://deliveroojs.onrender.com">deliveroojs.onrender.com</a>
            <br/>

            a: left, s: down, d: right, w: up, q: pickup, e: putdown
            <br/>

            <h2 class="p-5 text-m">How to develop your own autonomous agents</h2>
            An library is available for JavaScript to interact with the APIs of the game (based on socket.io).
            <br/>
            Check the examples at <a href="github.com/unitn-ASA/DeliverooAgent.js">github.com/unitn-ASA/DeliverooAgent.js</a>.
            <br/>

        </div>

        <div class="sticky top-[100vh] px-20 py-10 text-xs bg-slate-300">
            Marco Robol - marco.robol@unitn.it - University of Trento
            <VersionPanel class="my-2"/>
        </div>
        <br/>

    </main>

</template>

<style scoped>
</style>