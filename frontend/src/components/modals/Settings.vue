<script setup>

    import { ref, inject, computed, onMounted } from 'vue'
    import { connection } from '@/states/myConnection.js';
    import api from '../../utils/api.js';

    const admin = computed(() => {
        return connection?.payload?.role == 'admin';
    });

    const inputFocused = ref(undefined);

    function setConfig(key, value) {
        if ( value == "true" || value == "false" ) {
            value = value == "true";
        }
        let config = {};
        config[key] = value;
        api.patchConfig( connection.token, config );
        inputFocused.value = undefined;
    }

    // Plugins: publicly visible list, admin-only actions
    const plugins = ref([]);
    const pluginsReady = ref(false);
    const pluginsError = ref(undefined);
    const pluginBusy = ref(undefined);
    const pluginMessage = ref(undefined);

    /**
     * Merge the registered plugins with the catalog of available ones.
     * Builtins have no manifest file, so they only appear once registered.
     */
    async function refreshPlugins() {
        pluginsError.value = undefined;
        try {
            const registered = await api.getPlugins();
            const available = await api.getAvailablePlugins();
            const byId = new Map();

            for ( const p of (available?.plugins || []) ) {
                byId.set(p.id, {
                    id: p.id,
                    name: p.name,
                    version: p.version,
                    description: p.description,
                    manifestPath: p.manifestPath,
                    modulePath: p.modulePath,
                    registered: p.registered,
                    running: p.running,
                    lastError: undefined
                });
            }
            for ( const p of (registered?.plugins || []) ) {
                if ( byId.has(p.id) ) {
                    Object.assign(byId.get(p.id), p);
                } else {
                    byId.set(p.id, {
                        id: p.id,
                        name: p.name,
                        version: p.version,
                        description: p.description,
                        registered: true,
                        running: p.running,
                        lastError: p.lastError
                    });
                }
            }

            plugins.value = Array.from(byId.values()).sort( (a, b) =>
                (b.registered - a.registered) || String(a.name).localeCompare(String(b.name))
            );
            pluginsReady.value = true;
        } catch (error) {
            pluginsError.value = String(error?.message || error);
        }
    }

    /**
     * Run a lifecycle action on a plugin, then refresh the list.
     * @param {'load'|'start'|'stop'|'reload'|'unload'} action
     * @param {object} plugin
     */
    async function pluginAction(action, plugin) {
        if ( !admin.value ) return;
        if ( action == 'unload' && !confirm(`Unload plugin ${plugin.name}?`) ) return;

        pluginBusy.value = plugin.id;
        pluginMessage.value = undefined;
        try {
            if ( action == 'load' )
                await api.loadPlugin(connection.token, {
                    autoStart: true,
                    manifestPath: plugin.manifestPath,
                    modulePath: plugin.modulePath
                });
            else if ( action == 'start' )
                await api.startPlugin(connection.token, plugin.id);
            else if ( action == 'stop' )
                await api.stopPlugin(connection.token, plugin.id);
            else if ( action == 'reload' )
                await api.reloadPlugin(connection.token, plugin.id, { autoStart: true });
            else if ( action == 'unload' )
                await api.unloadPlugin(connection.token, plugin.id);
            pluginMessage.value = `${plugin.name}: ${action} ok`;
        } catch (error) {
            pluginMessage.value = `${plugin.name}: ${action} failed - ${String(error?.message || error)}`;
        } finally {
            pluginBusy.value = undefined;
            await refreshPlugins();
        }
    }

    function statusBadge(plugin) {
        if ( plugin.lastError ) return 'badge-error';
        if ( plugin.running ) return 'badge-success';
        if ( plugin.registered ) return 'badge-ghost';
        return 'badge-outline';
    }

    function statusLabel(plugin) {
        if ( plugin.lastError ) return 'error';
        if ( plugin.running ) return 'running';
        if ( plugin.registered ) return 'loaded';
        return 'available';
    }

    onMounted(refreshPlugins);

</script>

<template>
<main>

    <div class="mx-auto space-y-1">

        <div class="flex flex-col space-y-1">

            <div class="items-center space-x-1 flex justify-between text-xs"
            v-for="[key, value] of Object.entries(connection.configs)">
                <span class="flex-none inline-block align-middle">{{ key }}</span>
                <input
                    class="btn-xs text-right"
                    :class="{ 'checkbox checkbox-warning': typeof value == 'boolean',
                              'grow input input-ghost': typeof value != 'boolean' }"
                    size="2"
                    v-model="connection.configs[key]"
                    :type="typeof value == 'number' ? 'number' : typeof value == 'boolean' ? 'checkbox' : 'text'"
                    placeholder="Name"
                    @focus="inputFocused = key"
                    @blur=""
                    v-bind:disabled="!admin"
                >
                <button
                    v-show="inputFocused == key"
                    class="flex-none btn btn-outline btn-error btn-xs"
                    @click="setConfig(key, value)" v-if="admin"
                >
                    Set
                </button>
            </div>

        </div>

        <!-- Plugins -->
        <div class="divider text-xs my-2">Plugins</div>

        <div class="flex items-center justify-between text-xs">
            <span v-if="pluginsError" class="text-error">{{ pluginsError }}</span>
            <span v-else-if="pluginMessage"
                  :class="pluginMessage.includes('failed') ? 'text-error' : 'text-success'">
                {{ pluginMessage }}
            </span>
            <span v-else class="opacity-50">{{ plugins.length }} plugins</span>
            <button class="btn btn-ghost btn-xs" @click="refreshPlugins"
                    :class="{ 'loading': pluginBusy === undefined && !pluginsReady }">
                Refresh
            </button>
        </div>

        <div class="flex flex-col space-y-1">
            <div class="items-center space-x-2 flex justify-between text-xs"
                 v-for="plugin of plugins" :key="plugin.id">

                <span class="flex-none inline-flex items-center gap-1 min-w-0">
                    <span class="truncate">{{ plugin.name }} <span class="opacity-50">v{{ plugin.version }}</span></span>
                    <span class="badge badge-xs" :class="statusBadge(plugin)">{{ statusLabel(plugin) }}</span>
                </span>

                <span class="flex-none inline-flex items-center gap-1">
                    <button v-if="admin && !plugin.registered && pluginBusy != plugin.id"
                            class="btn btn-outline btn-success btn-xs"
                            @click="pluginAction('load', plugin)">
                        Load
                    </button>
                    <button v-if="admin && plugin.registered && !plugin.running && pluginBusy != plugin.id"
                            class="btn btn-outline btn-xs"
                            @click="pluginAction('start', plugin)">
                        Start
                    </button>
                    <button v-if="admin && plugin.registered && plugin.running && pluginBusy != plugin.id"
                            class="btn btn-outline btn-warning btn-xs"
                            @click="pluginAction('stop', plugin)">
                        Stop
                    </button>
                    <button v-if="admin && plugin.registered && pluginBusy != plugin.id"
                            class="btn btn-ghost btn-xs"
                            @click="pluginAction('reload', plugin)">
                        Reload
                    </button>
                    <button v-if="admin && plugin.registered && pluginBusy != plugin.id"
                            class="btn btn-outline btn-error btn-xs"
                            @click="pluginAction('unload', plugin)">
                        Unload
                    </button>
                    <span v-if="pluginBusy == plugin.id" class="loading loading-spinner loading-xs"></span>
                </span>

            </div>
        </div>

    </div>

</main>
</template>

<style scoped>
</style>
