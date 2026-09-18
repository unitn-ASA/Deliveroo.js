import PluginBase from '../PluginBase.js';
import { agentComponentRegistry } from '../../agentComponents/registry.js';
import GhostMovementComponent from './GhostMovementComponent.js';
import PushMovementComponent from './PushMovementComponent.js';
import RotationMovementComponent from './RotationMovementComponent.js';

/**
 * Runtime provider for optional movement modes and presets.
 *
 * The core standard preset remains available when this plugin is stopped.
 * Already-attached optional components keep working unchanged.
 */
class MovementModesPlugin extends PluginBase {

    /** @type {string[]} */
    #registeredComponents = [];

    /** @type {string[]} */
    #registeredPresets = [];

    constructor() {
        super({
            id: 'movement-modes',
            name: 'Movement Modes',
            version: '1.0.0',
            description: 'Provides optional ghost, push, and rotation movement presets'
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
            ['ghost-movement', GhostMovementComponent],
            ['push-movement', PushMovementComponent],
            ['rotation-movement', RotationMovementComponent]
        ];
        for (const [id, ComponentClass] of components) {
            agentComponentRegistry.registerComponent(id, ComponentClass);
            this.#registeredComponents.push(id);
        }

        const presets = {
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

export default MovementModesPlugin;
