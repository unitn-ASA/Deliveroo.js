<script setup>

    import { ref } from 'vue'
    import { richiediToken } from '../apiClient.js';
    import { user, myTokens } from '../states/user.js';
    import RoomsView from './Rooms.vue';
    import { useRoute, useRouter } from 'vue-router'

    const router = useRouter()
    const route = useRoute()

    

    const name = ref('marco');
    const team = ref('disi');
    const password = ref('password');

    async function requestToken() {

        let {token, payload} = await richiediToken(name.value, team.value, password.value);

        // console.log(token, payload);
        
        myTokens.set( token, payload );

    }

    function copyToClipboard(text) {
        var tempInput = document.createElement('textarea');
        tempInput.value = text;
        document.body.appendChild(tempInput);
        tempInput.select();
        document.execCommand('copy');
        document.body.removeChild(tempInput);
    }

    function removeToken(token) {
        myTokens.delete( token );
    }

    function useToken(token, payload) {
        user.value = { token, payload };
        router.push({ query: {name:payload.name} });
    }



</script>

<template>
  <main>
    
    <div class="allertPopUpScreen">

        <div class="allertPopUp">
            <h2>Tokens</h2>
        </div>
        
        <div>

            <div class="token-container" v-for="[token,payload] of myTokens.entries()">

                <div class="agent-team">
                    <div class="info-div">
                        <span class="name-span">{{ payload.name }}</span>
                        <span class="id-span">({{ payload.id }})</span>
                    </div>
                    <div class="info-div">
                        <span class="name-span">{{ payload.teamName }}</span>
                        <span class="id-span">({{ payload.teamId }})</span>
                    </div>
                    <span class="role-span">{{ payload.role }}</span>
                    
                </div>

                <div class="buttons">
                    <button class="copy-button" @click="copyToClipboard(token)">Copy</button>
                    <button class="delete-button" @click="removeToken(token)">X</button>
                    <button class="join-button" @click="useToken(token, payload)">{{token != user.token ? 'Login' : 'Logged'}}</button>
                </div>

            </div>

        </div>
        
        <div class="inputs">

            <input v-model="name" class="input" type="text" placeholder="Name" >
            <input v-model="team" class="input" type="text" placeholder="Team" >
            <input v-model="password" class="input" type="password" placeholder="AdminPassword" >
            <button id="addButton" v-on:click="requestToken()">Request</button>
        
        </div>
        
    </div>

  </main>
</template>

<style scoped>

    .token-container {
        background: rgba(0, 0, 0, 0.15); 
        padding: 0.25rem; 
        position: relative; 
        bottom: 0; 
        left: 0; 
        right: 0; 
        display: flex;
        max-height: 300px; 
        overflow-y: auto; 
        scrollbar-width: none;
        box-sizing: border-box; 
        backdrop-filter: blur(10px); 

        display: flex;
        align-items: center;
        border-radius: 5px;
        break-inside: avoid;
        margin-bottom: 10px;
    }

    .token-container .agent-team {
        flex-basis: 65%; 
        max-width: 65%;
        align-self: stretch; 
        display: flex;
        flex-direction: row;
        justify-content: space-between;
    }

    .token-container .agent-team div{
        flex-basis: 50%; 
        max-width: 50%; 
    }

    .token-container .buttons{
        margin-left: auto; 
    }

    .token-container .id-span {
        font-size: xx-small;
        color: red;
        margin-left: 3px;
    }

    .token-container button {
        margin-left: 10px;
        padding: 5px 10px;
        border: none;
        border-radius: 3px;
        cursor: pointer;
    }

    .token-container button.delete-button {
        background-color: red;
        color: white;
    }


    .form-add-agent{
        display: flex;
        flex-direction: row; 
        margin-top: 10px;
    }

    .form-add-agent .inputs{
        flex-basis: 65%; 
        max-width: 65%;
        margin-right: 10px; 
        display: flex;
        flex-direction: row; 
    }

    #addButton{
        background-color: #e6780e; 
        border: 2px solid #f0f0f0;
        color: white; 
        padding: 5px 10px;
        text-align: center;
        text-decoration: none;
        display: inline-block;
        border-radius: 5px; 
        cursor: pointer;
        margin-left: auto;
        margin-right: auto;
        height: 30px;
    }

    .input{
        margin-right: 5px;
        flex-basis: 45%; 
        max-width: 45%; 
        background-color: #FFF;
        height: 25px;
        text-decoration: none;
        border-radius: 5px; 
        border: 2px solid #f0f0f0;
    }

</style>