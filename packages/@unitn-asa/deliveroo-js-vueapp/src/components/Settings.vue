<script setup>

    import { ref } from 'vue'
    import { richiediToken } from '../apiClient.js';
    import { user, myTokens } from '../states/user.js';
    import { settings } from '../states/settings.js';

    const emit = defineEmits(['settings']); // Define the emit for settings

    const name = ref('marco');
    const team = ref('disi');
    const password = ref('');
    const token = ref('');

    async function requestToken() {
        let {token, payload} = await richiediToken(name.value, team.value, password.value);
        // console.log(token, payload);
        myTokens.set( token, payload );
    }

    function useToken(token, payload) {
        user.value = { token, payload };
        emit('settings', { token, payload });
    }



</script>

<template>
    <main>

    <div class="mx-auto pb-10 space-y-1">
        
        <div class="table">
            <div class="bg-black bg-opacity-25 max-h-75 box-border p-2 backdrop-blur-md items-center rounded-xl break-inside-avoid mb-2"
                v-for="[key, value] of Object.entries(settings)">
                
                <div class="flex-1 flex justify-between text-sm">
                    <span class="">{{ key }}</span>
                    <div class="">
                        <input v-model="settings[key]" class="input bg-white text-black btn-sm" type="text" placeholder="Name">
                    </div>
                    <div class="space-x-4">
                        <button class="btn btn-outline btn-error btn-sm" @click="removeToken(token)">Set</button>
                    </div>
                </div>
                
            </div>
        </div>
    
    </div>

    </main>
</template>

<style scoped>
    .input {
        @apply border-2 border-gray-200;
    }
</style>