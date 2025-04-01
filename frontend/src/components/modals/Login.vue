<script setup>

    import { ref, computed } from 'vue'
    import { richiediToken } from '../../apiClient.js';
    import { myTokens } from '@/states/myTokens.js';
    import LoginToken from './LoginToken.vue';
    import { copyToClipboard, pasteFromClipboard } from '@/utils/copyPaste.js';
	import { connection } from '@/states/myConnection.js';
    import { jwtDecode } from 'jwt-decode';

    const emit = defineEmits(['play']); // Define the emit for login

    const name = ref('anonymous');
    const team = ref('');
    const password = ref('');
    const token = ref('');

    const decodedToken = computed ( () => {
        let decodedToken = {name:undefined, id:null, teamName:null, teamId:null, role:null}
        if (token.value) {
            try {
                decodedToken = jwtDecode(token.value);
                return decodedToken;
            } catch (e) {
                return decodedToken;
            }
        }
        return decodedToken;
    });

    async function requestToken() {
        let {token, payload} = await richiediToken(name.value, team.value, password.value);
        myTokens.push( token );
        // getOrCreateConnection( token );
    }

    async function saveToken() {
        myTokens.push( token.value );
        // getOrCreateConnection( token.value );
        token.value = '';
    }

    function play( token ) {
        emit('play', token );
    }

</script>

<template>
    <main>

    <div class="w-5/6 mx-auto pb-10 space-y-4">
        
        <div class="text-center my-6 text-xl">
            <h2>Tokens</h2>
        </div>
        
        <div class="table" >
            <div class="bg-black bg-opacity-25 max-h-75 box-border p-2 backdrop-blur-md items-center rounded-xl break-inside-avoid mb-2"
                v-for="token of myTokens"
                :key="myTokens.length"
            >

                <LoginToken :token="token" @play="play"/>

            </div>
        </div>
        
        <form class="flex text-black rounded space-x-4" onsubmit="return false">
            <input v-model="name" class="input bg-white btn-sm" type="text" placeholder="Name">
            <input v-model="team" class="input bg-white btn-sm" type="text" placeholder="Team">
            <input v-model="password" class="input bg-white btn-sm" autocomplete="password" type="password" placeholder="AdminPassword">
            <button class="btn btn-primary btn-sm" @click="requestToken">New token</button>
        </form>
        
        <div class="flex rounded space-x-4">
            <input v-model="token" class="input bg-white text-black btn-sm" type="text" placeholder="Token">
            <button class="btn btn-outline btn-info btn-sm" @click="async()=>token=await pasteFromClipboard()">
                Paste
            </button>
            <button id="saveButton" class="btn btn-info btn-sm" :disabled="!decodedToken.id" @click="saveToken">
                <span v-if="!decodedToken.id" class="text-xs text-red-500">Token invalid</span>
                <span v-if="decodedToken.id" class="font-semibold">Save token</span>
                <div v-if="decodedToken.id" class="flex space-x-2">
                    <span class="text-sm">{{ decodedToken.name }}</span>
                    <span class="text-xs text-red-500">{{ decodedToken.id }}</span>
                    <span class="text-sm">{{ decodedToken.teamName }}</span>
                    <span class="text-xs text-red-500">{{ decodedToken.teamId }}</span>
                    <span class="text-sm" >role</span>
                    <span class="text-xs text-red-500">{{ decodedToken.role }}</span>
                </div>
            </button>
        </div>
    
    </div>

    </main>
</template>

<style scoped>
    .input {
        @apply border-2 border-gray-200;
    }
</style>