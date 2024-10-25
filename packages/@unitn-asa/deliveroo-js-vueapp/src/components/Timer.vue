<script setup>

    import { ref, reactive, onMounted, defineProps, onUnmounted } from 'vue'

    const emit = defineEmits(['timer'])

    const props = defineProps({
        startTime: Date,
        endTime: Date
    });
    
    const timer = ref(0);              // negative,     positive,   zero
    const status = ref('');            // not started,  started,    ended
    const formattedhhmmss = ref(0);
    
    var intervalRef;

    onMounted( async () => {
        intervalRef = setInterval( () => {

            const currentTime = new Date();
            const startTime = new Date(props.startTime);
            const endTime = new Date(props.endTime);
            
            // if not yet started
            if ( currentTime < startTime ) {
                status.value = 'not started';
                // compute time left to start
                timer.value = - new Date( startTime - currentTime ).getTime();
            }
            
            // if not yet ended
            else if ( currentTime < endTime ) {
                status.value = 'started';            
                // compute remaining time in ms
                timer.value = new Date( endTime - currentTime ).getTime();
            }
            
            // if ended
            else {
                status.value = 'ended';
                timer.value = 0;
            }
            
            formattedhhmmss.value = new Date( Math.abs(timer.value) ).toISOString().substr(11, 8);
            emit('timer', timer.value);

        }, 1000);
    });

    onUnmounted( () => {
        clearInterval(intervalRef);
    });
    
</script>

<template>
        <span v-if=" status == 'not started' "  style="color:blue" > Ready to start in {{ formattedhhmmss }}                    </span>
        <span v-if=" status == 'started' "      style="color:red"  > Time left {{ formattedhhmmss }}                            </span>
        <span v-if=" status == 'ended' "                           > Match ended {{ new Date(props.endTime).toLocaleString() }} </span>
</template>

<style scoped>
</style>