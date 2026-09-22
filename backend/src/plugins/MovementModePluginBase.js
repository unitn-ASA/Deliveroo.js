import PluginBase from './PluginBase.js';

/**
 * Provider plugin for one movement mode: attaches its component to every
 * agent, existing at init and added later. The component itself is
 * attribute-driven: it claims the 'move' command while 'movement_mode'
 * selects the mode, and releases it otherwise.
 */
class MovementModePluginBase extends PluginBase {

    /** @type {new () => import('./MovementModeComponentBase.js').default} */
    #Component;

    /** @type {Map<import('../core/Agent.js').default, import('./MovementModeComponentBase.js').default>} */
    #attached = new Map();

    /** @type {((event: any) => void) | null} */
    #agentsListener = null;

    /**
     * @param {import('./PluginBase.js').PluginManifest} manifest
     * @param {{Component: new () => import('./MovementModeComponentBase.js').default}} options
     */
    constructor(manifest, { Component }) {
        super(manifest);
        this.#Component = Component;
    }

    /**
     * @param {import('./PluginBase.js').PluginContext} context
     * @returns {Promise<boolean>}
     */
    async init(context) {
        this.#agentsListener = ({ object, type }) => {
            if (type === 'removed') {
                this.#attached.delete(object);
                return;
            }
            if (object) this.#attach(object);
        };
        context.grid.agents.onChanged(this.#agentsListener);
        for (const agent of Array.from(context.grid.agents.getIterator())) {
            this.#attach(agent);
        }
        return true;
    }

    /**
     * @param {import('./PluginBase.js').PluginContext} context
     * @returns {Promise<boolean>}
     */
    async shutdown(context) {
        if (this.#agentsListener) {
            context.grid.agents.offChanged(this.#agentsListener);
            this.#agentsListener = null;
        }
        // Releasing the components frees the 'move' slot: the standard
        // movement self-heals it through the bus 'changed' event
        for (const [agent, component] of Array.from(this.#attached)) {
            agent.detachComponent(component);
        }
        this.#attached.clear();
        return true;
    }

    /**
     * @param {import('../core/Agent.js').default} agent
     */
    #attach(agent) {
        if (this.#attached.has(agent)) return;
        const component = new this.#Component();
        agent.attachComponent(component);
        this.#attached.set(agent, component);
    }

}

export default MovementModePluginBase;
