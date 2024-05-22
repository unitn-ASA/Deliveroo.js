<script setup>
import { RouterLink, RouterView } from 'vue-router';
</script>

<template>

<header>
    <div class="wrapper">
        <nav>
            <RouterLink to="/">Home</RouterLink>
            <RouterLink to="/login">Login</RouterLink>
            <RouterLink to="/game/0">Game/0</RouterLink>
            <RouterLink to="/about">About</RouterLink>
        </nav>
    </div>
  </header>

  <RouterView />

</template>

<style scoped>

    nav {
        position: absolute;
        top: 0px;
        z-index: 100;
        width: 100%;
        font-size: 1em;
        text-align: center;
        margin-top: 1rem;
    }

    nav a {
        margin: 0 1rem;
        color: white;
        background-color: black;
    }

</style>
