<script setup>
    import { ref, provide } from 'vue';
    import { useRouter } from 'vue-router';
    import Login from '../components/Login.vue';

    /** @type {import("vue").Ref<import("@/Connection").Connection>} */
    const connection = ref( null );
    provide( "connection", connection );

    const router = useRouter();

    function play ( token ) {
        router.push( { path: '/', query: {token} } )
    }

</script>

<template>

    <main class="pt-20" >
    
        <Login @play="play"/>

    </main>

</template>

<style scoped>
</style>