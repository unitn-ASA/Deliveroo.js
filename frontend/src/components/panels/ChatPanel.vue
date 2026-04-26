<script setup>
    
    import { ref, watch, nextTick, computed } from 'vue';
    import { connection } from '../../states/myConnection.js';

    const admin = computed(() => {
        return connection?.payload?.role == 'admin';
    });
    const grid = connection?.grid;
    const me = grid?.me;

    const selectedAgent = ref('All');
    const input = ref('');

    const reversedMsgs = computed(() => connection?.msgs.slice().reverse() ?? []);

    function sendMsg() {
        console.log('sendMsg', selectedAgent.value, input.value);
        if (input.value.length > 0) {
            if (selectedAgent.value == 'All') {
                connection.ioClient.emitShout(input.value);
            } else {
                connection.ioClient.emitSay(selectedAgent.value, input.value);
            }
            connection?.msgs.push({
                timestamp: Date.now(),
                socket: connection.ioClient.id,
                id: me.value.id,
                msg: input.value,
                name: me.value.name
            });
            input.value = '';
        }
    }
    
    function formatTime(ts) {
        const d = new Date(ts);
        return d.getHours().toString().padStart(2, '0') + ':' +
                d.getMinutes().toString().padStart(2, '0');
    }

</script>

<template>
    <main class="absolute left-0 right-0 bottom-0 pointer-events-none">

        <!-- Messages container -->
        <div class="
            text-xs
            flex flex-col-reverse overflow-auto
            max-h-32 hover:max-h-screen transition-[max-height] duration-200
            [mask-image:linear-gradient(to_top,black_70%,transparent)]
            hover:[mask-image:none]
            hover:[-webkit-mask-image:none]"
        >
            <!-- Each message -->
            <div v-for="{timestamp, socket, id, msg, name} of reversedMsgs"
                 :key="`${timestamp}-${socket}-${id}-${msg}`"
                 class="chat chat-end"
                 :class="id == me.id ? 'chat-end' : 'chat-start'"
            >
                <!-- Message bubble -->
                 <div class="chat-bubble opacity-100 text-left rounded-md px-2 pt-0 pb-1 min-w-0 min-h-0 pointer-events-auto"
                      :class="id == me.id ? 'chat-bubble-neutral' : 'chat-bubble-info'"
                >
                    <div class="chat-header text-xs font-bold text-right">
                        <!-- <time class="text-xs opacity-50">{{timestamp}}</time> -->
                        {{ name.length > 10 ? name.slice(0,4) + '...' + name.slice(-3) : name }}
                        <span class="font-none opacity-50">{{ id == me.id ? '(me)' : `${id}` }}</span>
                    </div>
                    <span class="whitespace-pre-wrap">
                        {{ msg.length > 100 ? msg.slice(0,80) + '\n   . . .' + msg.slice(-10) : msg }}
                    </span>
                    <span class="opacity-50 float-right pl-1">
                        {{ formatTime(timestamp) }}
                    </span>
                    <!-- <div class="chat-footer opacity-50">Seen</div> -->
                </div>
            </div>

        </div>
            
        <!-- Area to send a msg -->
        <div class="join w-full py-2 pointer-events-auto relative w-full">
            <!-- Textarea -->
            <textarea
                class="join-item textarea leading-tight w-full text-left h-10 text-base-content border-base-content/20"
                placeholder="Type a message..."
                v-model="input"
                @keydown.enter.exact.prevent="sendMsg"
            />
            <!-- Send button -->
            <div class="join-item btn btn-info btn-xs h-auto flex flex-col items-center gap-1"
                 @click="sendMsg()"
            >
                <span class="font-bold cursor-pointer">Send to</span>
                <select
                    id="agent-select"
                    v-model="selectedAgent"
                    @click.stop
                    class="select select-xs ml-1 p-0 text-center bg-base text-base-content h-auto appearance-none bg-none"
                >
                    <option value="All">everyone</option>
                    <option
                        v-if="grid?.agents"
                        v-for="agent in Array.from(grid?.agents?.values()).filter(agent => agent.id != me.id)"
                        :key="agent.id"
                        :value="agent.id"
                    >
                        {{ agent.name.length > 10 ? agent.name.slice(0,4) + '...' + agent.name.slice(-3) : agent.name }}
                    </option>
                </select>
            </div>
        </div>

    </main>
</template>

<style>
</style>