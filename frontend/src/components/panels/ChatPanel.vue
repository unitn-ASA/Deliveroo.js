<script setup>
    
    import { ref, watch, nextTick, computed } from 'vue';
    import { connection } from '../../states/myConnection.js';

    const admin = computed(() => {
        return connection?.payload?.role == 'admin';
    });
    const grid = connection?.grid;
    const me = grid?.me;
    const clock = grid?.clock;

    const selectedAgent = ref('All');
    const input = ref('');

    function sendMsg() {
        console.log('sendMsg', selectedAgent.value, input.value);
        if (input.value.length > 0) {
            if (selectedAgent.value == 'All') {
                connection.socket.emitShout(input.value);
            } else {
                connection.socket.emitSay(selectedAgent.value, input.value);
            }
            input.value = '';
        }
    }

    const messagesEnd = ref(null);

    watch( () => connection?.msgs.length,
        async () => {
            await nextTick();
            if (messagesEnd.value) {
                messagesEnd.value.scrollTop = messagesEnd.value.scrollHeight;
            }
        }
    );

</script>

<template>
    <main>

        <!-- messages -->
        <div class="text-xs mb-8 sticky bottom-0 overflow-auto max-h-40"
             ref="messagesEnd">
            <div v-for="{timestamp, socket, id, msg, name} of connection?.msgs" class="text-xs pb-0">
                <span> {{ name }}: {{ msg }} </span>
                <br/>
            </div>
        </div>
            
        <!-- input area to send a msg -->
        <div class="flex items-center gap-2 absolute bottom-0 p-2">
            <div class="flex items-center gap-2">
                <label for="agent-select" class="text-xs">To:</label>
                <select
                    id="agent-select"
                    v-model="selectedAgent"
                    class="select select-xs select-bordered w-20 max-w-xs"
                >
                    <option value="All">All</option>
                    <option
                        v-if="grid?.agents"
                        v-for="agent in Array.from(grid?.agents?.values()).filter(agent => agent.id != me.id)"
                        :key="agent.id"
                        :value="agent.id"
                    >
                        {{ agent.name }}
                    </option>
                </select>
            </div>
            <input
                type="text"
                class="input input-bordered input-xs w-full max-w-xs"
                placeholder="Type a message..."
                v-model="input"
                @keyup.enter="sendMsg()"
            />
            <button class="btn btn-info btn-xs" @click="sendMsg()">Send</button>
        </div>

    </main>
</template>

<style>
</style>