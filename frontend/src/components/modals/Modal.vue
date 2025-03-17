<script setup>
    
    import { ref } from 'vue';

    const props = defineProps({
        title: {
            type: String,
            required: true
        }
    });

    // const isModalVisible = ref(true); // Reactive variable for modal visibility
    const isModalVisible = defineModel({ default: false });


    const toggleModal = () => {
        isModalVisible.value = !isModalVisible.value; // Toggle modal visibility
    };

</script>

<template>

        <div v-show="isModalVisible">
            <div class="absolute w-screen h-screen pt-20">
                <div class="w-2/3 mx-auto pb-10 grid grid-flow-row space-y-4">
                    <div class="z-30 flex items-center space-x-4 float-right w-full">
                        <div class="text-center text-xl bg-neutral/85 dark:bg-gray-700 rounded-lg py-2 flex-1 h-full">
                            {{ title }}
                        </div>
                        <button class="btn btn-square btn-error" @click="toggleModal">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6"
                            fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                    <div class="z-30 bg-neutral/85 dark:bg-gray-700 rounded-lg">

                        <slot/>

                    </div>
                </div>
            </div>
        </div>

        <div :class="[
                isModalVisible ? 'bg-black bg-opacity-50' : 'opacity-0 pointer-events-none'
            ]"
            class="fixed z-20 top-0 bottom-0 right-0 left-0 backdrop-blur-md transition-all duration-300"
            >
        </div>

</template>

<style>
</style>