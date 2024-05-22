<script setup>

    import { ref, reactive, onBeforeMount } from 'vue'
    import { getMatches, createMatch, deleteMatch } from '../apiClient.js';
    import Timer from './Timer.vue';
    
    const newMatchTitle = ref('newMatch');
    const matches = reactive([]);

    onBeforeMount( async () => {
        matches.push( ... await getMatches() );
    });

    async function startMatchButton () {
        createRoom();
        matches.splice(0, matches.length, ... await getMatches() );
    };

    async function createMatchButton () {
        createMatch(newMatchTitle.value, new Date().toISOString(), new Date().toISOString() );
        matches.splice(0, matches.length, ... await getMatches() );
    };

    async function deleteMatchButton (match) {
        deleteMatch(match._id);
        matches.splice(0, matches.length, ... await getMatches() );
    };

</script>

<template>
  <main>

    <h2>Matches</h2>
    
    <ul>
        <li v-for="match of matches">
            <a :href="'/api/matches/'+match._id">{{ match.matchTitle }}</a>
            <a :href="'/game?roomId='+match.roomId" > Join room {{ match.roomId }} </a>
            <Timer :startTime="match.startTime" :endTime="match.endTime" @timer="" />
            <button v-on:click="deleteMatchButton(match)">Delete match</button>
        </li>
    </ul>

    <input type="text" v-model="newMatchTitle" />
    <button @click="createMatchButton()">Create new Match</button>

  </main>
</template>

<style scoped>

</style>