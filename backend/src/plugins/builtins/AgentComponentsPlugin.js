import PluginBase from '../PluginBase.js';
import { agentComponentRegistry } from '../../agentComponents/registry.js';
import StandardMovementComponent from '../../agentComponents/movement/StandardMovementComponent.js';
import GhostMovementComponent from '../../agentComponents/movement/GhostMovementComponent.js';
import PushMovementComponent from '../../agentComponents/movement/PushMovementComponent.js';
import RotationMovementComponent from '../../agentComponents/movement/RotationMovementComponent.js';
import ParcelCarrierComponent from '../../agentComponents/ParcelCarrierComponent.js';

/**
 * Global provider for the built-in agent components and presets.
 *
 * Runs once at startup and populates the agent component registry before
 * any agent is created (npc-spawner creates agents in its own init).
 * Stopping it empties the registry: new agents are created without command
 * components, while already-attached agents keep working unchanged.
 */
class AgentComponentsPlugin extends PluginBase {

    /** @type {string[]} */
    #registeredComponents = [];

    /** @type {string[]} */
    #registeredPresets = [];

    constructor() {
        super({
            id: 'agent-components',
            name: 'Agent Components',
            version: '1.0.0',
            description: 'Provides built-in agent components and presets (standard, ghost, push, rotation)'
        });
    }

    /**
     * @param {import('../PluginBase.js').PluginContext} context
     * @returns {Promise<boolean>}
     */
    async init(context) {
        void context;

        /** @type {[string, new () => import('../../agentComponents/registry.js').AgentComponent][]} */
        const components = [
            ['standard-movement', StandardMovementComponent],
            ['ghost-movement', GhostMovementComponent],
            ['push-movement', PushMovementComponent],
            ['rotation-movement', RotationMovementComponent],
            ['parcel-carrier', ParcelCarrierComponent]
        ];
        for (const [id, ComponentClass] of components) {
            agentComponentRegistry.registerComponent(id, ComponentClass);
            this.#registeredComponents.push(id);
        }

        const presets = {
            standard: ['standard-movement', 'parcel-carrier'],
            ghost: ['ghost-movement', 'parcel-carrier'],
            push: ['push-movement', 'parcel-carrier'],
            rotation: ['rotation-movement', 'parcel-carrier']
        };
        for (const [name, ids] of Object.entries(presets)) {
            agentComponentRegistry.registerPreset(name, ids);
            this.#registeredPresets.push(name);
        }

        return true;
    }

    /**
     * @param {import('../PluginBase.js').PluginContext} context
     * @returns {Promise<boolean>}
     */
    async shutdown(context) {
        void context;

        for (const name of this.#registeredPresets) {
            agentComponentRegistry.unregisterPreset(name);
        }
        for (const id of this.#registeredComponents.reverse()) {
            agentComponentRegistry.unregisterComponent(id);
        }
        this.#registeredPresets = [];
        this.#registeredComponents = [];

        return true;
    }

}

export default AgentComponentsPlugin;
