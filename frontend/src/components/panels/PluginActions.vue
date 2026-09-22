<script setup>

    import { ref, watch } from 'vue';
    import { connection } from '../../states/myConnection.js';

    /**
     * Clickable buttons for the commands discovered on this agent's command
     * bus: joystick-like buttons, parameterless. The list is fetched from
     * the REST API (readable by the agent itself) on mount and refreshed
     * whenever the game configuration changes (plugin start/stop). Native
     * commands are filtered out here: they already have dedicated socket
     * events and keyboard controls. Each click invokes the command through
     * the generic 'action' socket event; the SDK unwraps the acknowledgement
     * envelope and throws on failure.
     */

    var HOST = import.meta.env.VITE_SOCKET_IO_HOST || window.location.origin;

    const NATIVE_COMMANDS = new Set(['up', 'down', 'left', 'right', 'pickup', 'putdown']);

    /** @type {import("vue").Ref<{command: string, owner: string, description?: string}[]>} */
    const commands = ref([]);

    async function refresh () {
        const id = connection?.grid?.me?.value?.id;
        if (!id || !connection?.token) return;
        try {
            const res = await fetch(`${HOST}/api/agents/${id}/commands`, {
                headers: { 'x-token': connection.token }
            });
            if (!res.ok) return;
            const body = await res.json();
            commands.value = (body.commands ?? []).filter(({ command }) => !NATIVE_COMMANDS.has(command));
        } catch (error) {
            console.warn('[PluginActions] fetch failed:', error);
        }
    }

    /**
     * @param {{command: string, description?: string}} command
     */
    async function invoke ( { command } ) {
        if (!connection?.ioClient) return;
        try {
            const result = await connection.ioClient.emitAction(command);
            console.log(`[PluginActions] ${command} ->`, result);
        } catch (error) {
            console.warn(`[PluginActions] ${command} failed:`, error.message);
        }
    }

    refresh();

    // Plugin start/stop goes through a configuration change
    watch(() => connection?.configs?.GAME, refresh, { deep: true });

</script>

<template>
    <div v-if="commands.length"
         class="z-10 bg-neutral rounded-lg px-3 py-1.5 text-xs w-80 opacity-80 hover:opacity-100">
        <div class="font-medium mb-1">Actions</div>
        <div class="flex flex-wrap gap-1">
            <button v-for="command in commands" :key="command.command"
                    class="btn btn-info btn-xs text-white"
                    :title="command.description ?? command.command"
                    @click="invoke(command)">
                {{ command.command }}
            </button>
        </div>
    </div>
</template>
