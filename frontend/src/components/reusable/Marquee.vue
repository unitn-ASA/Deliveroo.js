<script setup>    
    import { computed, reactive, watch } from 'vue';
</script>

<template>
    <main class="relative overflow-hidden">
        <div class="absolute left-0 marquee flex whitespace-nowrap gap-4 width-auto">
            <span>
                <slot></slot>
            </span>
            <span>
                <slot></slot>
            </span>
            <span>
                <slot></slot>
            </span>
            <span>
                <slot></slot>
            </span>
            <span>
                <slot></slot>
            </span>
        </div>
        <!-- Needed to have the required height -->
        <span class="z-0 opacity-0 pointer-events-none">
            <slot></slot>
        </span>
    </main>
</template>

<style>
@keyframes scroll-text {
    0%   { transform: translateX(0); }
    100% { transform: translateX(-20%); }
}
.marquee {
    animation: scroll-text 3s linear infinite;
}
.marquee:hover {
    animation-play-state: paused;
}
</style>