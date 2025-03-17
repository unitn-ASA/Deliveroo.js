<script setup>
    
    import Deliveroojs from '../components/threejs/Deliveroojs.vue';
    import GamePanels from '@/components/panels/GamePanels.vue';
    import { connection, connectionKey } from '../states/myConnection.js';

</script>

<template>
    <main>

        <div :key="connectionKey" > <!-- Use the key to force reload -->

            <GamePanels/>
    
            <Deliveroojs v-if="connection"/>
        
        </div>

    </main>
</template>

<style>
</style>