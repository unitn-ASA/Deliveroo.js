<script setup>
    import { ref, provide } from 'vue';
    import { useRouter } from 'vue-router';

    const router = useRouter();

</script>

<template>

    <main class="pt-20" >

        <h1 class="text-lg">Deliveroo.js</h1>
        
        Deliveroo.js it's an Educational Game, developed by Marco Robol for the course on Autonomous Software Agents (ASA) by Prof. Paolo Giorgini.
        <br/>
        It is a Grid-Based parcel collection videogame. You can play in Multi-Player from your browser or develop your own Autonomous Agent that plays in your place.

        <h2 class="text-lg">How to play</h2>
        
        Play online from your browser at <a href="deliveroojs.onrender.com">deliveroojs.onrender.com</a> or clone the repository at
        <a href="https://github.com/marcorobol/deliveroojs">https://github.com/marcorobol/deliveroojs</a> and run it locally with npm start.
        <br/>

        a: left, s: down, d: right, w: up, q: pickup, e: putdown
        <br/>

        Enter with name god to have unlimited observation distance and administration capabilities.
        <br/>
        Click on the map to create or dispose parcels and use shift to click and modify tiles into delivery, walkable, spawning, and remove the tile.
        <br/>

        <h2 class="text-lg">How to develop your own autonomous agents</h2>
        An library is available for JavaScript to interact with the APIs of the game (based on socket.io).
        <br/>
        Check the examples at <a href="github.com/unitn-ASA/DeliverooAgent.js">github.com/unitn-ASA/DeliverooAgent.js</a>.
        <br/>
    
        <span class="text-xs">
            Marco Robol - marco.robol@unitn.it - University of Trento - 2022/2023
        </span>
        <br/>

    </main>

</template>

<style scoped>
</style>