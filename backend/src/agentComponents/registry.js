import { EventEmitter } from 'events';

/**
 * @typedef {Object} AgentComponent
 * @property {string} id
 * @property {(agent: import('../core/Agent.js').default) => void} [start] - Registers commands on agent.commands
 * @property {(agent: import('../core/Agent.js').default) => void} [stop] - Releases what start acquired
 */

/**
 * Central registry of agent component factories and named presets.
 * Populated by global provider plugins (e.g. AgentComponentsPlugin) and
 * consumed by Grid.createAgent and the agent REST surface.
 *
 * This registry stores factories and preset names only: commands are NOT
 * managed here. Components register command handlers directly on each
 * agent's own command bus (agent.commands).
 *
 * @extends {EventEmitter<{
 *      "component:registered": [string],
 *      "component:unregistered": [string],
 *      "preset:registered": [string, string[]],
 *      "preset:unregistered": [string]
 * }>}
 */
class AgentComponentRegistry extends EventEmitter {

    /** @type {Map<string, new () => AgentComponent>} componentId -> factory */
    #components = new Map();

    /** @type {Map<string, string[]>} presetName -> componentIds */
    #presets = new Map();

    constructor() {
        super();
        this.setMaxListeners(0);
    }

    /**
     * Register a component factory.
     * @param {string} id
     * @param {new () => AgentComponent} ComponentClass
     * @returns {AgentComponentRegistry}
     */
    registerComponent(id, ComponentClass) {
        if (typeof ComponentClass !== 'function') {
            throw new Error(`AgentComponentRegistry: component '${id}' must be a class`);
        }
        if (this.#components.has(id)) {
            throw new Error(`AgentComponentRegistry: component '${id}' is already registered`);
        }
        this.#components.set(id, ComponentClass);
        this.emit('component:registered', id);
        return this;
    }

    /**
     * Remove a component factory. Fails while any preset still uses it.
     * @param {string} id
     * @returns {boolean}
     */
    unregisterComponent(id) {
        if (!this.#components.has(id)) {
            return false;
        }
        const usedBy = this.#presetUsing(id);
        if (usedBy) {
            throw new Error(`AgentComponentRegistry: component '${id}' is used by preset '${usedBy}'`);
        }
        this.#components.delete(id);
        this.emit('component:unregistered', id);
        return true;
    }

    /**
     * Register a named preset (bundle of component ids).
     * @param {string} name
     * @param {string[]} componentIds
     * @returns {AgentComponentRegistry}
     */
    registerPreset(name, componentIds) {
        if (this.#presets.has(name)) {
            throw new Error(`AgentComponentRegistry: preset '${name}' is already registered`);
        }
        if (!Array.isArray(componentIds) || componentIds.length === 0) {
            throw new Error(`AgentComponentRegistry: preset '${name}' needs a non-empty array of component ids`);
        }
        for (const id of componentIds) {
            if (!this.#components.has(id)) {
                throw new Error(`AgentComponentRegistry: preset '${name}' references unknown component '${id}'`);
            }
        }
        this.#presets.set(name, [...componentIds]);
        this.emit('preset:registered', name, [...componentIds]);
        return this;
    }

    /**
     * Remove a preset.
     * @param {string} name
     * @returns {boolean}
     */
    unregisterPreset(name) {
        if (!this.#presets.has(name)) {
            return false;
        }
        this.#presets.delete(name);
        this.emit('preset:unregistered', name);
        return true;
    }

    /**
     * @returns {string[]}
     */
    getPresets() {
        return Array.from(this.#presets.keys());
    }

    /**
     * @param {string} name
     * @returns {boolean}
     */
    hasPreset(name) {
        return this.#presets.has(name);
    }

    /**
     * Instantiate the components of a preset and attach them to the agent.
     * Only attaches: callers own the agent component lifecycle (stop first
     * when re-attaching, see routes/agents.js).
     * @param {import('../core/Agent.js').default} agent
     * @param {string} presetName
     * @returns {import('../core/Agent.js').default}
     */
    applyPreset(agent, presetName) {
        const componentIds = this.#presets.get(presetName);
        if (!componentIds) {
            throw new Error(`AgentComponentRegistry: unknown agent preset '${presetName}'`);
        }
        for (const id of componentIds) {
            const ComponentClass = this.#components.get(id);
            agent.attachComponent(new ComponentClass());
        }
        return agent;
    }

    /**
     * @param {string} componentId
     * @returns {string | null} preset name using the component, if any
     */
    #presetUsing(componentId) {
        for (const [name, ids] of this.#presets) {
            if (ids.includes(componentId)) {
                return name;
            }
        }
        return null;
    }

}

/**
 * Shared singleton so the domain (Grid) and provider plugins resolve the
 * same registry without import cycles.
 * @type {AgentComponentRegistry}
 */
const agentComponentRegistry = new AgentComponentRegistry();

export { agentComponentRegistry, AgentComponentRegistry };
