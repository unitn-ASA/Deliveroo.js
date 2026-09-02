import { randomUUID } from 'crypto';

/**
 * Plugin contract:
 * - init(context) - acquire resources, register command handlers, subscribe to grid events
 * - shutdown(context) - release everything acquired in init
 *
 * A plugin is any component that can be started and stopped at runtime.
 * Identity metadata only: no event declarations, the plugin subscribes
 * itself to whatever it needs through the context.
 */

/**
 * @typedef {Object} PluginManifest
 * @property {string} [id]
 * @property {string} [name]
 * @property {string} [version]
 * @property {string} [description]
 */

/**
 * @typedef {Object} PluginResolvedManifest
 * @property {string} id
 * @property {string} name
 * @property {string} version
 * @property {string} description
 */

/**
 * @typedef {Object} PluginContext
 * @property {import('../core/Grid.js').default} grid - The game grid; `grid.emitter` broadcasts game-state facts
 * @property {import('../utils/CommandBus.js').CommandBus} commands - Server command bus; one handler per command
 * @property {PluginBase} plugin
 */

/**
 * @typedef {Object} PluginStatus
 * @property {string} id
 * @property {string} name
 * @property {string} version
 * @property {string} description
 * @property {'idle'|'starting'|'running'|'stopped'|'error'} status
 * @property {number | null} startedAt
 * @property {number | null} stoppedAt
 * @property {number | null} uptime
 * @property {string | null} lastError
 */

class PluginBase {
    /**
     * @param {PluginManifest} [manifest]
     * @param {Record<string, any>} [options]
     */
    constructor(manifest = {}, options = {}) {
        this.id = manifest.id || `plugin-${randomUUID()}`;
        this.name = manifest.name || this.id;
        this.version = manifest.version || '1.0.0';
        this.description = manifest.description || '';
        this.options = options;
        /** @type {'idle'|'starting'|'running'|'stopped'|'error'} */
        this.status = 'idle';
        this.startedAt = null;
        this.stoppedAt = null;
        this.lastError = null;
    }

    /**
     * @returns {PluginResolvedManifest}
     */
    getManifest() {
        return {
            id: this.id,
            name: this.name,
            version: this.version,
            description: this.description
        };
    }

    /**
     * Lifecycle bookkeeping (status, startedAt, stoppedAt) is owned by the
     * registry; subclasses override init/shutdown without calling super.
     *
     * @param {PluginContext} context
     * @returns {Promise<boolean>}
     */
    async init(context) {
        void context;
        return true;
    }

    /**
     * @param {PluginContext} context
     * @returns {Promise<boolean>}
     */
    async shutdown(context) {
        void context;
        return true;
    }

    /**
     * @returns {PluginStatus}
     */
    getStatus() {
        return {
            ...this.getManifest(),
            status: this.status,
            startedAt: this.startedAt,
            stoppedAt: this.stoppedAt,
            uptime: this.startedAt ? (this.stoppedAt || Date.now()) - this.startedAt : null,
            lastError: this.lastError
        };
    }
}

export default PluginBase;
