import { EventEmitter } from 'events';
import fs from 'fs/promises';
import path from 'path';
import { pathToFileURL } from 'url';
import CommandBus from '../utils/CommandBus.js';
import PluginBase from './PluginBase.js';

/**
 * @typedef {Object} PluginSource
 * @property {string | null} manifestPath
 * @property {string} modulePath
 * @property {object} options
 */

/**
 * Central plugin registry: manages the lifecycle of runtime components.
 * Plugins subscribe themselves to grid facts (grid.emitter) and register
 * command handlers (commandBus) through the context they receive in init().
 * @extends {EventEmitter<{
 *      "plugin:registered": [PluginBase],
 *      "plugin:unregistered": [string],
 *      "plugin:started": [PluginBase],
 *      "plugin:stopped": [PluginBase],
 *      "plugin:error": [{pluginId: string, error: string}]
 * }>}
 */
class PluginRegistry extends EventEmitter {
    /**
     * @constructor
     */
    constructor() {
        super();
        this.setMaxListeners(0);

        /** @type {Map<string, PluginBase>} */
        this.plugins = new Map();
        /** @type {Set<string>} */
        this.runningPlugins = new Set();
        /** @type {import('../core/Grid.js').default | null} */
        this.grid = null;
        /** @type {import('../utils/CommandBus.js').CommandBus} */
        this.commandBus = new CommandBus();
        /** @type {Map<string, PluginSource>} */
        this.pluginSources = new Map();
    }

    /**
     * Attach the grid so plugins receive it in their context.
     * @param {import('../core/Grid.js').default} grid
     */
    attachGrid(grid) {
        this.grid = grid;
    }

    /**
     * Register a plugin instance in the registry.
     * @param {PluginBase} plugin
     * @returns {PluginBase}
     */
    register(plugin) {
        if (!(plugin instanceof PluginBase)) {
            throw new Error('Plugin must extend PluginBase');
        }
        if (!plugin.id) {
            throw new Error('Plugin must have an id');
        }
        if (this.plugins.has(plugin.id)) {
            throw new Error(`Plugin ${plugin.id} already registered`);
        }

        this.plugins.set(plugin.id, plugin);
        this.emit('plugin:registered', plugin);
        return plugin;
    }

    /**
     * Unregister a plugin, stopping it first when necessary.
     * @param {string} pluginId
     * @returns {Promise<boolean>}
     */
    async unregister(pluginId) {
        const plugin = this.plugins.get(pluginId);
        if (!plugin) {
            return false;
        }

        if (this.runningPlugins.has(pluginId)) {
            await this.stop(pluginId);
        }

        this.plugins.delete(pluginId);
        this.pluginSources.delete(pluginId);
        this.emit('plugin:unregistered', pluginId);
        return true;
    }

    /**
     * Start a registered plugin.
     * @param {string} pluginId
     * @returns {Promise<boolean>}
     */
    async start(pluginId) {
        const plugin = this.plugins.get(pluginId);
        if (!plugin) {
            throw new Error(`Plugin ${pluginId} not found`);
        }
        if (this.runningPlugins.has(pluginId)) {
            return false;
        }

        /** @type {import('./PluginBase.js').PluginContext} */
        const context = {
            grid: this.grid,
            commands: this.commandBus,
            plugin
        };
        plugin.status = 'starting';

        try {
            const ok = await plugin.init(context);
            if (!ok) {
                plugin.status = 'error';
                return false;
            }

            this.runningPlugins.add(pluginId);
            plugin.status = 'running';
            plugin.startedAt = Date.now();
            plugin.stoppedAt = null;
            this.emit('plugin:started', plugin);
            return true;
        } catch (error) {
            plugin.status = 'error';
            plugin.lastError = error.message;
            this.emit('plugin:error', { pluginId, error: error.message });
            return false;
        }
    }

    /**
     * Stop a running plugin.
     * @param {string} pluginId
     * @returns {Promise<boolean>}
     */
    async stop(pluginId) {
        const plugin = this.plugins.get(pluginId);
        if (!plugin) {
            throw new Error(`Plugin ${pluginId} not found`);
        }
        if (!this.runningPlugins.has(pluginId)) {
            return false;
        }

        try {
            await plugin.shutdown(this.#contextFor(plugin));
            this.runningPlugins.delete(pluginId);
            plugin.status = 'stopped';
            plugin.stoppedAt = Date.now();
            this.emit('plugin:stopped', plugin);
            return true;
        } catch (error) {
            plugin.status = 'error';
            plugin.lastError = error.message;
            this.emit('plugin:error', { pluginId, error: error.message });
            return false;
        }
    }

    /**
     * Dynamically load a plugin class from manifest/module files and register it.
     * @param {{manifestPath?: string, modulePath?: string, options?: object}} params
     * @returns {Promise<PluginBase>}
     */
    async loadFromFiles({ manifestPath, modulePath, options = {} } = {}) {
        if (!manifestPath && !modulePath) {
            throw new Error('manifestPath or modulePath is required');
        }

        let manifest = {};
        let resolvedManifestPath = null;
        if (manifestPath) {
            resolvedManifestPath = path.resolve(process.cwd(), manifestPath);
            manifest = JSON.parse(await fs.readFile(resolvedManifestPath, 'utf8'));
        }

        const resolvedModulePath = modulePath
            ? path.resolve(process.cwd(), modulePath)
            : path.resolve(path.dirname(resolvedManifestPath), manifest.module);

        const PluginClass = await this.#loadPluginClass(resolvedModulePath, true);
        const plugin = new PluginClass(manifest, options);

        this.register(plugin);
        this.pluginSources.set(plugin.id, {
            manifestPath: resolvedManifestPath,
            modulePath: resolvedModulePath,
            options
        });

        return plugin;
    }

    /**
     * Reload a plugin from its original source files.
     * @param {string} pluginId
     * @param {{autoStart?: boolean}} params
     * @returns {Promise<PluginBase>}
     */
    async reload(pluginId, { autoStart } = {}) {
        const source = this.pluginSources.get(pluginId);
        const existing = this.plugins.get(pluginId);
        if (!source || !existing) {
            throw new Error(`Reload source not available for plugin ${pluginId}`);
        }

        const wasRunning = this.runningPlugins.has(pluginId);
        await this.unregister(pluginId);

        const plugin = await this.loadFromFiles(source);
        const shouldStart = autoStart === undefined ? wasRunning : Boolean(autoStart);
        if (shouldStart) {
            await this.start(plugin.id);
        }

        return plugin;
    }

    /**
     * @param {string} pluginId
     * @returns {PluginBase | undefined}
     */
    get(pluginId) {
        return this.plugins.get(pluginId);
    }

    /**
     * @param {string} pluginId
     * @returns {boolean}
     */
    has(pluginId) {
        return this.plugins.has(pluginId);
    }

    /**
     * @param {string} pluginId
     * @returns {boolean}
     */
    isRunning(pluginId) {
        return this.runningPlugins.has(pluginId);
    }

    /**
     * @returns {PluginBase[]}
     */
    getAll() {
        return Array.from(this.plugins.values());
    }

    /**
     * @returns {PluginBase[]}
     */
    getRunning() {
        return Array.from(this.runningPlugins)
            .map((id) => this.plugins.get(id))
            .filter(Boolean);
    }

    /**
     * Stop all currently running plugins.
     * @returns {Promise<number>}
     */
    async stopAll() {
        const ids = Array.from(this.runningPlugins);
        let count = 0;
        for (const id of ids) {
            if (await this.stop(id)) {
                count += 1;
            }
        }
        return count;
    }

    /**
     * Stop and clear the entire registry.
     * @returns {Promise<number>}
     */
    async clear() {
        await this.stopAll();
        const count = this.plugins.size;
        this.plugins.clear();
        this.runningPlugins.clear();
        this.pluginSources.clear();
        return count;
    }

    /**
     * @returns {{totalPlugins: number, runningPlugins: number, commandHandlers: {command: string, owner: string}[], plugins: object[]}}
     */
    getStatus() {
        return {
            totalPlugins: this.plugins.size,
            runningPlugins: this.runningPlugins.size,
            commandHandlers: this.commandBus.getRegisteredCommands(),
            plugins: this.getAll().map((plugin) => plugin.getStatus())
        };
    }

    /**
     * @param {PluginBase} plugin
     * @returns {import('./PluginBase.js').PluginContext}
     */
    #contextFor(plugin) {
        return {
            grid: this.grid,
            commands: this.commandBus,
            plugin
        };
    }

    /**
     * Dynamically import a plugin class from disk.
     * @param {string} absPath
     * @param {boolean} [bustCache=false]
     * @returns {Promise<any>}
     */
    async #loadPluginClass(absPath, bustCache = false) {
        const fileUrl = pathToFileURL(absPath).href + (bustCache ? `?v=${Date.now()}` : '');
        const module = await import(fileUrl);
        if (typeof module.default !== 'function') {
            throw new Error(`Invalid plugin module at ${absPath}: default export must be a class`);
        }
        return module.default;
    }
}

export default PluginRegistry;
