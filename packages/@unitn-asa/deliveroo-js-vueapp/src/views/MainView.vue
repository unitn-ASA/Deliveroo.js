<script setup>
    
    import { ref, provide, watch} from 'vue';
    import { getOrCreateConnection, getConnectionByName } from '../states/myConnections.js';
    import Login from '../components/Login.vue';
    import Deliveroojs from '../components/Deliveroojs.vue';
    import GamePanels from '@/components/GamePanels.vue';

    const deliverooKey = ref(0); // Key for Deliveroojs component
    
    const isOverlayVisible = ref(true); // Reactive variable for overlay visibility
    
    /** @type {import("vue").Ref<import("@/Connection").Connection>} */
    const connection = ref( null );
    provide( "connection", connection );

    const toggleOverlay = () => {
        isOverlayVisible.value = !isOverlayVisible.value; // Toggle overlay visibility
    };

    // /** @type {import("vue").Ref<{token:string,payload:Object},{token:string,payload:Object}>} */
    // const user = ref( { token: '', payload: {} } );
    
    // get name from query params ?name=marco
    const urlParams = new URLSearchParams(window.location.search);
    const name = urlParams.get('name');
    const token = urlParams.get('token');
    if ( name ) {
        console.log( 'MainView.js name:', name );
        connection.value = getConnectionByName( name );
        if ( connection.value ) {
            connection.value.connect();
            isOverlayVisible.value = false; // Hide the overlay
            deliverooKey.value += 1; // Increment the key to force reload Deliveroojs
        }
    } else if ( token ) {
        console.log( 'MainView.js token:', token );
        connection.value = getOrCreateConnection( token );
        if ( connection.value ) {
            connection.value.connect();
            isOverlayVisible.value = false; // Hide the overlay
            deliverooKey.value += 1; // Increment the key to force reload Deliveroojs
        }
    } else {
        console.log( 'MainView.js no user' );
    }

    watch( connection, ({token, payload}) => {
        // set query param to payload.name e.g. ?name=marco
        const url = new URL(window.location);
        url.searchParams.set('name', connection.value.payload.name);
        window.history.replaceState({}, '', url);
        // router.push({ query: {name:payload.name} });
    });

    function play ( token ) {
        connection.value = getOrCreateConnection( token );
        connection.value.connect();
        isOverlayVisible.value = false; // Hide the overlay
        deliverooKey.value += 1; // Increment the key to force reload Deliveroojs
    };

    function login () {
        isOverlayVisible.value = true; // Show the overlay
    }

</script>

<template>
    <main>

        <div v-show="isOverlayVisible" class="login-overlay">
            <div class="absolute w-full h-full pt-20">
                <div class="w-2/3 mx-auto pb-10 grid grid-flow-row space-y-4">
                    <div id="login-titlebar" class="z-30 flex items-center space-x-4 float-right w-full">
                        <div class="text-center text-xl bg-white/85 dark:bg-gray-700 rounded-lg py-2 flex-1 h-full">
                            Login / Signup
                        </div>
                        <button class="btn btn-square btn-error" @click="toggleOverlay">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6"
                            fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                    <div class="z-30 bg-white/85 dark:bg-gray-700 rounded-lg">
                        <Login @play="play"/>
                    </div>
                </div>
            </div>
        </div>

        <div :class="[
                isOverlayVisible ? 'bg-black bg-opacity-50' : 'opacity-0 pointer-events-none'
            ]"
            class="fixed z-20 top-0 bottom-0 right-0 left-0 backdrop-blur-md transition-all duration-300"
            >
        </div>

        <div :key="deliverooKey" >

            <GamePanels :key="deliverooKey" v-if="connection" @login="login" class="flex text-sm text-white" />
    
            <Deliveroojs :key="deliverooKey" v-if="connection" /> <!-- Use the key to force reload -->
        
        </div>

    </main>
</template>

<style>
</style>