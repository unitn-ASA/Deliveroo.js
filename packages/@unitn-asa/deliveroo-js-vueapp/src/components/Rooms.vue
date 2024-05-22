<script setup>

    import { ref, reactive, onMounted } from 'vue'
    import { getRooms, createRoom, freezeRoom, unfreezeRoom, deleteRoom, getMatches, createMatch } from '../apiClient.js';
    import Timer from './Timer.vue';
    
    const rooms = reactive([]);
    const newRoomTitle = ref('room10');

    onMounted( async () => {
        rooms.push( ... await getRooms() );
        for (let room of rooms) {
            room.matches = await getMatches(room.roomId);
        }
    });

    async function refreshRooms () {
        rooms.splice(0, rooms.length, ... await getRooms() );
        for (let room of rooms) {
            room.matches = await getMatches(room.roomId);
        }
    };

    async function freezeRoomButton (roomId) {
        freezeRoom(roomId);
        refreshRooms();
    };

    async function unfreezeRoomButton (roomId) {
        unfreezeRoom(roomId);
        refreshRooms();
    };

    async function createRoomButton () {
        createRoom();
        refreshRooms();
    };

    async function deleteRoomButton (roomId) {
        deleteRoom(roomId);
        refreshRooms();
    };

    async function startNewMatchButton (roomId) {
        createMatch(roomId, new Date(), new Date() );
        refreshRooms();
    };

</script>

<template>
  <main>

    <h2>Rooms</h2>
    
    <ul>
        <li v-for="room of rooms">
            ({{ room.roomId }})
            <a :href="'/game/'+room.roomId" > Join room </a>
            <a href="#" v-if="room.freezed" v-on:click="unfreezeRoomButton(room.roomId)"> 
                Unfreeze
            </a>
            <a href="#" v-if="!room.freezed" v-on:click="freezeRoomButton(room.roomId)">
                Freeze
            </a>
            <button v-on:click="deleteRoomButton(room.roomId)">Delete room</button>

            <button @click="startNewMatchButton(room.roomId)">Start new Match</button>

            <ul>
                <li v-for="match of room.matches">

                    <a :href="'/api/matches/'+match._id">{{ match.matchTitle }}</a>
                    <Timer :startTime="match.startTime" :endTime="match.endTime" @timer="" />
                    
                </li>
            </ul>

        </li>
    </ul>

    <button @click="createRoomButton()">Create new Room</button>

  </main>
</template>

<style scoped>

</style>