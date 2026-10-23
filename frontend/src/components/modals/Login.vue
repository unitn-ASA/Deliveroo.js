<script setup>

    import { ref, computed } from 'vue'
    import { myTokens } from '@/states/myTokens.js';
    import LoginToken from './LoginToken.vue';
    import VersionPanel from '@/components/panels/VersionPanel.vue';
    import { copyToClipboard, pasteFromClipboard } from '@/utils/copyPaste.js';
	import { connection } from '@/states/myConnection.js';
    import { jwtDecode } from 'jwt-decode';
    import api from '../../utils/api.js';

    const emit = defineEmits(['play']); // Define the emit for login

    // Documentation is served by the backend, which may differ from the frontend origin in development
    const HOST = import.meta.env.VITE_SOCKET_IO_HOST || window.location.origin;

    // Outline icons are SVG markup on a 24x24 grid, the filled GitHub mark is a 16x16 path
    const docLinks = [
        { label: 'SDK docs', href: `${HOST}/docs/sdk/`,
          icon: '<path d="m8 6-6 6 6 6M16 6l6 6-6 6"/>' },
        { label: 'REST API', href: `${HOST}/api-docs`,
          icon: '<path d="M4 8h14m-4-4 4 4-4 4M20 16H6m4-4-4 4 4 4"/>' },
        { label: 'Example agents', href: 'https://github.com/unitn-ASA/DeliverooAgent.js',
          icon: '<rect x="5" y="8" width="14" height="11" rx="2"/><path d="M12 8V4m-2 0h4"/><circle cx="9.5" cy="13.5" r="1"/><circle cx="14.5" cy="13.5" r="1"/>' },
        { label: 'Developer docs', href: `${HOST}/docs/`,
          icon: '<path d="M12 6.5C10.5 5 8 4.5 4 4.5v13c4 0 6.5.5 8 2 1.5-1.5 4-2 8-2v-13c-4 0-6.5.5-8 2Zm0 0v13"/>' },
        { label: 'GitHub', href: 'https://github.com/unitn-ASA/Deliveroo.js', filled: true,
          icon: 'M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0 0 16 8c0-4.42-3.58-8-8-8Z' },
    ];

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
        let {token, payload} = await api.getToken(name.value, team.value, password.value);
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

    <div class="py-5 text-s text-neutral-content bg-neutral">
        
        <div class="w-5/6 mx-auto">
            <p>
                <span class="font-semibold">Deliveroo.js</span> is a multi-player, grid-based parcel collection game
                for the <bold class="font-semibold">Autonomous Software Agents</bold> course at the University of Trento. 
            </p>
            <div class="flex flex-wrap gap-x-5 gap-y-1 pt-1">
                <a v-for="link of docLinks" :key="link.label" :href="link.href" target="_blank"
                   class="link link-hover inline-flex items-center gap-1.5">
                    <svg v-if="link.filled" class="size-4" viewBox="0 0 16 16" fill="currentColor"><path :d="link.icon"/></svg>
                    <svg v-else class="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                         stroke-width="2" stroke-linecap="round" stroke-linejoin="round" v-html="link.icon"></svg>
                    {{ link.label }}
                </a>
            </div>
        </div>

    </div>

    <div class="w-5/6 mx-auto pb-10 space-y-4">
        
        <div class="my-6">
            <p>
                To play, create or paste a <bold class="font-bold">token</bold> below, then move with
                <kbd class="kbd kbd-xs">W</kbd> <kbd class="kbd kbd-xs">A</kbd> <kbd class="kbd kbd-xs">S</kbd> <kbd class="kbd kbd-xs">D</kbd>,
                pick up parcels with <kbd class="kbd kbd-xs">Q</kbd> and put them down with <kbd class="kbd kbd-xs">E</kbd>.
            </p>
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

    <div class="sticky top-[100vh] px-20 py-10 text-xs text-neutral-content bg-neutral">
        Marco Robol - marco.robol@unitn.it - University of Trento
        <VersionPanel class="my-2"/>
    </div>

    </main>
</template>

<style scoped>
    .input {
        @apply border-2 border-gray-200;
    }
</style>