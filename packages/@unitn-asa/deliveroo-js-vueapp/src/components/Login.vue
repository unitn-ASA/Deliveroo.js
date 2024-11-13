<script setup>

    import { ref, inject } from 'vue'
    import { richiediToken } from '../apiClient.js';
    import { myTokens } from '@/states/myTokens.js';
    import LoginToken from './LoginToken.vue';
    import { copyToClipboard, pasteFromClipboard } from '@/utils/copyPaste.js';

    const emit = defineEmits(['play']); // Define the emit for login

    /** @type {import("vue").Ref<import("@/Connection").Connection>} */
    const connection = inject( "connection" );

    const name = ref('marco');
    const team = ref('disi');
    const password = ref('');
    const token = ref('');

    async function requestToken() {
        let {token, payload} = await richiediToken(name.value, team.value, password.value);
        myTokens.push( token );
        // getOrCreateConnection( token );
    }

    async function saveToken() {
        myTokens.push( token );
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
        
        <div class="table">
            <div class="bg-black bg-opacity-25 max-h-75 box-border p-2 backdrop-blur-md items-center rounded-xl break-inside-avoid mb-2"
                v-for="token of myTokens">
                
                <LoginToken :token="token" @play="play"/>
                
                <!-- <div class="flex-1 flex justify-between text-sm">
                    <div class="">
                        <span class="text-sm">{{ connection.payload.name }}</span>
                        <span class="text-xs text-red-500 ml-1">({{ connection.payload.id }})</span>
                    </div>
                    <div class="">
                        <span class="text-sm">{{ connection.payload.teamName }}</span>
                        <span class="text-xs text-red-500 ml-1">({{ connection.payload.teamId }})</span>
                    </div>
                    <span class="text-sm">{{ connection.payload.role }}</span>
                    <div class="space-x-4">
                        <div class="tooltip" data-tip="Copy">
                            <button class="btn btn-outline btn-info btn-sm" @click="copyToClipboard(token)">
                                ...{{ token.slice(-10) }}
                            </button>
                        </div>
                        <div class="tooltip" data-tip="Remove">
                            <button class="btn btn-outline btn-error btn-sm" @click="removeToken(token)">
                                X
                            </button>
                        </div>
                        <button class="btn btn-sm w-24" :class="[connection.state.connected ? 'btn-success' : 'btn-info']" @click="connect(connection)">
                            {{ connection.state.connected ? 'Disconnect' : 'Connect' }}
                        </button>
                        <button class="btn btn-sm w-16" :class="[user && token == user.token ? 'btn-success' : 'btn-info']" @click="play(connection)">
                            {{ user && token == user.token ? 'Playing' : 'Play' }}
                        </button>
                    </div>
                </div> -->
                
            </div>
        </div>
        
        <div class="flex text-black rounded space-x-4">
            <input v-model="name" class="input bg-white btn-sm" type="text" placeholder="Name">
            <input v-model="team" class="input bg-white btn-sm" type="text" placeholder="Team">
            <input v-model="password" class="input bg-white btn-sm" type="password" placeholder="AdminPassword">
            <button id="addButton" class="btn btn-primary btn-sm" @click="requestToken">New token</button>
        </div>
        
        <div class="flex text-black rounded space-x-4">
            <input v-model="token" class="input bg-white btn-sm" type="text" placeholder="Token">
            <button class="btn btn-outline btn-info btn-sm" @click="async()=>token=await pasteFromClipboard()">Paste</button>
            <button id="saveButton" class="btn btn-primary btn-sm" @click="saveToken">Save token</button>
        </div>
    
    </div>

    </main>
</template>

<style scoped>
    .input {
        @apply border-2 border-gray-200;
    }
</style>