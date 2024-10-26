<script setup>

    import { ref } from 'vue'
    import { richiediToken } from '../apiClient.js';
    import { user, myTokens } from '../states/user.js';
    import { useRoute, useRouter } from 'vue-router'
    import { jwtDecode } from "jwt-decode";

    const emit = defineEmits(['login']); // Define the emit for login
    const router = useRouter();
    const route = useRoute();  

    const name = ref('marco');
    const team = ref('disi');
    const password = ref('');
    const token = ref('');

    async function requestToken() {
        let {token, payload} = await richiediToken(name.value, team.value, password.value);
        // console.log(token, payload);
        myTokens.set( token, payload );
    }

    async function saveToken() {
        try {
            let payload = jwtDecode( token.value );
            console.log( payload );
            myTokens.set( token.value, payload );
        } catch (error) {
            console.error( 'Invalid token', token.value, error );
        }
    }

    function copyToClipboard(text) {
        var tempInput = document.createElement('textarea');
        tempInput.value = text;
        document.body.appendChild(tempInput);
        tempInput.select();
        document.execCommand('copy');
        document.body.removeChild(tempInput);
    }

    function pasteFromClipboard() {
        navigator.clipboard.readText().then( text => {
            token.value = text;
        });
    }

    function removeToken(token) {
        myTokens.delete( token );
    }

    function useToken(token, payload) {
        user.value = { token, payload };
        router.push({ query: {name:payload.name} });
        emit('login', { token, payload });
    }



</script>

<template>
    <main>

    <div class="w-5/6 mx-auto pb-10 space-y-4">
        
        <div class="text-center my-6 text-xl">
            <h2>Tokens</h2>
        </div>
        
        <div class="table">
            <div class="bg-black bg-opacity-25 max-h-75 box-border p-2 backdrop-blur-md items-center rounded-xl break-inside-avoid mb-2"
                v-for="[token, payload] of myTokens.entries()">
                
                <div class="flex-1 flex justify-between text-sm">
                    <div class="">
                        <span class="text-sm">{{ payload.name }}</span>
                        <span class="text-xs text-red-500 ml-1">({{ payload.id }})</span>
                    </div>
                    <div class="">
                        <span class="text-sm">{{ payload.teamName }}</span>
                        <span class="text-xs text-red-500 ml-1">({{ payload.teamId }})</span>
                    </div>
                    <span class="text-sm">{{ payload.role }}</span>
                    <div class="space-x-4">
                        <button class="btn btn-outline btn-info btn-sm" @click="copyToClipboard(token)">Copy</button>
                        <button class="btn btn-outline btn-error btn-sm" @click="removeToken(token)">X</button>
                        <button class="btn btn-success btn-sm" @click="useToken(token, payload)">{{ user && token == user.token ? 'Logged' : 'Login' }}</button>
                    </div>
                </div>
                
            </div>
        </div>
        
        <div class="flex text-black rounded space-x-4">
            <input v-model="name" class="input bg-white btn-sm" type="text" placeholder="Name">
            <input v-model="team" class="input bg-white btn-sm" type="text" placeholder="Team">
            <input v-model="password" class="input bg-white btn-sm" type="password" placeholder="AdminPassword">
            <button id="addButton" class="btn btn-primary btn-sm" @click="requestToken()">New token</button>
        </div>
        
        <div class="flex text-black rounded space-x-4">
            <input v-model="token" class="input bg-white btn-sm" type="text" placeholder="Token">
            <button class="btn btn-outline btn-info btn-sm" @click="pasteFromClipboard()">Paste</button>
            <button id="saveButton" class="btn btn-primary btn-sm" @click="saveToken()">Save token</button>
        </div>
    
    </div>

    </main>
</template>

<style scoped>
    .input {
        @apply border-2 border-gray-200;
    }
</style>