<script setup>
    
    import { ref, provide, watch} from 'vue';
    import { getOrCreateConnection, getConnectionByName } from '../states/myConnections.js';
    import Login from '../components/Login.vue';
    import Deliveroojs from '../components/Deliveroojs.vue';
    import GamePanels from '@/components/GamePanels.vue';
    import Modal from '@/components/Modal.vue';

    const deliverooKey = ref(0); // Key for Deliveroojs component
    
    const loginModal = ref(true); // Reactive variable for overlay visibility
    
    /** @type {import("vue").Ref<import("@/Connection").Connection>} */
    const connection = ref( null );
    provide( "connection", connection );

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
            loginModal.value = false; // Hide the overlay
            deliverooKey.value += 1; // Increment the key to force reload Deliveroojs
        }
    } else if ( token ) {
        console.log( 'MainView.js token:', token );
        connection.value = getOrCreateConnection( token );
        if ( connection.value ) {
            connection.value.connect();
            loginModal.value = false; // Hide the overlay
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
        loginModal.value = false; // Hide the overlay
        deliverooKey.value += 1; // Increment the key to force reload Deliveroojs
    };

    function login () {
        loginModal.value = true; // Show the overlay
    }

</script>

<template>
    <main>

        <Modal v-model="loginModal" title="Login / Signup">
            <Login @play="play"/>
        </Modal>

        <div :key="deliverooKey" >

            <GamePanels :key="deliverooKey" v-if="connection" @login="login" class="flex text-sm text-white" />
    
            <Deliveroojs :key="deliverooKey" v-if="connection" /> <!-- Use the key to force reload -->
        
        </div>

    </main>
</template>

<style>
</style>