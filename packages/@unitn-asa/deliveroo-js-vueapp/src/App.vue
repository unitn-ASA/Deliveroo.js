<script setup>
    import { RouterLink, RouterView } from 'vue-router';
</script>

<template>

    <header>
        
        <nav class="fixed top-0 z-10 w-full text-center mt-5 text-white">
            
            <RouterLink to="/" class="btn btn-ghost opacity-90 bg-neutral mx-2">Game</RouterLink>
            
            <RouterLink to="/login" class="btn btn-ghost opacity-90 bg-neutral mx-2">Login</RouterLink>
            
        </nav>
        
    </header>
    
    <RouterView />
    
</template>

<style scoped>

    /* nav a {
        margin: 0 1rem;
        color: white;
        background-color: black;
    } */

</style>
