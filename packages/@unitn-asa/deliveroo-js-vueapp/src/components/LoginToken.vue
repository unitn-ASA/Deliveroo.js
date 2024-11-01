<script setup>

    import { computed, defineEmits } from 'vue';
    import { user } from '../states/user.js';
    import { myConnections, getOrCreateConnection } from '../states/myConnections.js';
    import { myTokens, removeToken } from '@/states/myTokens.js';
    import { copyToClipboard, pasteFromClipboard } from '@/utils/copyPaste.js';

    const emit = defineEmits(['login']); // Define the emit for login

    const { token } = defineProps(['token']);

    const connection = getOrCreateConnection( token );

    const connected = computed( () => connection && connection.state && connection.state.connected ? connection.state.connected : false );

    const payload = connection.payload
    const name = connection.payload.name
    const id = connection.payload.id
    const teamName = connection.payload.teamName
    const teamId = connection.payload.teamId
    const role = connection.payload.role

    function connect() {
        if ( connection.connected() ) {
            // console.log( 'LoginToken.js connect() disconnecting', connection.token.slice(0,10)+'...' );
            connection.disconnect();
        } else {
            // console.log( 'LoginToken.js connect() connecting', connection.token.slice(0,10)+'...' );
            connection.connect();
        }
        // user.value = { token, payload };
        // router.push({ query: {name:payload.name} });
        // emit('login', { token, payload });
    }

    function play() {
        console.log( 'LoginToken.js play()', token.slice(0,10)+'...', payload.name );
        user.value = { token, payload };
        emit('login', { token, payload });
    }


</script>

<template>
    <main>
        <div class="flex-1 flex justify-between text-sm">
            <div class="">
                <span class="text-sm">{{ name }}</span>
                <span class="text-xs text-red-500 ml-1">({{ id }})</span>
            </div>
            <div class="">
                <span class="text-sm">{{ teamName }}</span>
                <span class="text-xs text-red-500 ml-1">({{ teamId }})</span>
            </div>
            <span class="text-sm">{{ role }}</span>
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
                <button class="btn btn-sm w-24" :class="[connected ? 'btn-success' : 'btn-info']" @click="connect">
                    {{ connected ? 'Disconnect' : 'Connect' }}
                </button>
                <button class="btn btn-sm w-16" :class="[user && token == user.token ? 'btn-success' : 'btn-info']" @click="play">
                    {{ user && token == user.token ? 'Playing' : 'Play' }}
                </button>
            </div>
        </div>
    </main>
</template>

<style scoped>
</style>