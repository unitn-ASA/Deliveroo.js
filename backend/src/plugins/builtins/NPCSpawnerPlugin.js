import PluginBase from '../PluginBase.js';
import { config, configEmitter } from '../../config/config.js';
import Identity from '../../core/Identity.js';
import RandomWalk from '../../npc/RandomWalk.js';
import IntelligentCollector from '../../npc/IntelligentCollector.js';

/** @typedef {import('@unitn-asa/deliveroo-js-sdk/types/IOGameOptions.js').IONpcsOptions} IONpcsOptions */

/**
 * Creates and supervises the NPCs configured for the current game.
 * Autopilot behaviors stay in npc/; this plugin owns the agents and their
 * lifecycle: create on start, remove all on stop, and re-apply whenever the
 * game configuration changes.
 */
class NPCSpawnerPlugin extends PluginBase {

    /** @type {Map<string, {agent: import('../../core/Agent.js').default, stop: () => Promise<void>}>} agentId -> NPC */
    #npcs = new Map();

    /** @type {(() => void) | null} */
    #onGameChanged = null;

    /** @type {import('../../core/Grid.js').default | null} */
    #grid = null;

    constructor() {
        super({
            id: 'npc-spawner',
            name: 'NPC Spawner',
            version: '1.0.0',
            description: 'Creates and supervises the NPCs configured for the current game'
        });
    }

    /**
     * @param {import('../PluginBase.js').PluginContext} context
     * @returns {Promise<boolean>}
     */
    async init(context) {
        this.#grid = context.grid;
        this.#onGameChanged = () => {
            void this.#applyOptions(context, config.GAME.npcs || []);
        };
        configEmitter.on('GAME', this.#onGameChanged);
        await this.#applyOptions(context, config.GAME.npcs || []);
        console.log(`[NPCSpawnerPlugin] ${this.#npcs.size} NPC(s) running`);
        return true;
    }

    /**
     * @param {import('../PluginBase.js').PluginContext} context
     * @returns {Promise<boolean>}
     */
    async shutdown(context) {
        void context;
        if (this.#onGameChanged) {
            configEmitter.off('GAME', this.#onGameChanged);
            this.#onGameChanged = null;
        }
        this.#grid = null;
        // Deleting each agent triggers the NPC's own 'deleted' cleanup
        for (const npc of this.#npcs.values()) {
            await npc.agent.delete();
        }
        console.log('[NPCSpawnerPlugin] All NPCs removed');
        return true;
    }

    /**
     * @param {import('../PluginBase.js').PluginContext} context
     * @param {IONpcsOptions[]} npcs
     */
    async #applyOptions(context, npcs) {
        // Remove existing NPCs
        for (const npc of this.#npcs.values()) {
            await npc.agent.delete();
        }

        // Create new NPCs
        for (const npcOptions of npcs) {
            for (let i = 0; i < (npcOptions.count || 0); i++) {
                this.createNPC(npcOptions);
            }
        }
    }

    /**
     * Live map of running NPCs by agent id, exposed for the REST /api/npcs surface.
     * @returns {Map<string, any>}
     */
    get npcs() {
        return this.#npcs;
    }

    /**
     * Create and start an NPC from options (also used by POST /api/npcs).
     * @param {IONpcsOptions} options
     * @returns {any} the NPC
     */
    createNPC(options) {
        if (!this.#grid) {
            throw new Error('NPCSpawnerPlugin: grid is not available');
        }
        const agent = this.#grid.createAgent(new Identity());
        /** @type {import('../../npc/Autopilot.js').default} */
        let autopilot;
        switch (options.type) {
            case 'random':
                autopilot = new RandomWalk(options);
                break;
            case 'intelligent':
                autopilot = new IntelligentCollector(options);
                break;
            default:
                console.warn(`Unknown NPC type '${options.type}', defaulting to random`);
                autopilot = new RandomWalk(options);
        }

        agent.attachComponent(autopilot);
        const id = agent.identity.id;
        this.#npcs.set(id, autopilot);

        // Clean up when the NPC's agent is deleted by any other path
        agent.emitter.once('deleted', () => {
            if (this.#npcs.get(id) === autopilot) {
                this.#npcs.delete(id);
            }
        });

        return autopilot;
    }

    /**
     * @returns {import('../PluginBase.js').PluginStatus & {npcs: string[], count: number}}
     */
    getStatus() {
        return {
            ...super.getStatus(),
            npcs: Array.from(this.#npcs.keys()),
            count: this.#npcs.size
        };
    }

}

export default NPCSpawnerPlugin;
