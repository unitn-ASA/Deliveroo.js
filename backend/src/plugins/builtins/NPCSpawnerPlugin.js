import PluginBase from '../PluginBase.js';
import { config, configEmitter } from '../../config/config.js';
import RandomlyMovingNPC from '../../workers/RandomlyMovingNPC.js';
import IntelligentParcelNPC from '../../workers/IntelligentParcelNPC.js';

/** @typedef {import('@unitn-asa/deliveroo-js-sdk/types/IOGameOptions.js').IONpcsOptions} IONpcsOptions */

/**
 * Creates and supervises the NPCs configured for the current game.
 * NPC behaviors (random, intelligent) stay in workers/; this plugin owns
 * their lifecycle: create on start, remove all on stop, and re-apply
 * whenever the game configuration changes.
 */
class NPCSpawnerPlugin extends PluginBase {

    /** @type {Map<string, {agent: import('../../core/Agent.js').default, stop: () => Promise<void>}>} agentId -> NPC */
    #npcs = new Map();

    /** @type {(() => void) | null} */
    #onGameChanged = null;

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
        /** @type {{agent: import('../../core/Agent.js').default, start: () => void, stop: () => Promise<void>}} */
        let npc;
        switch (options.type) {
            case 'random':
                npc = new RandomlyMovingNPC(options);
                break;
            case 'intelligent':
                npc = new IntelligentParcelNPC(options);
                break;
            default:
                console.warn(`Unknown NPC type '${options.type}', defaulting to randomlyMoving`);
                npc = new RandomlyMovingNPC(options);
        }

        const id = npc.agent.identity.id;
        this.#npcs.set(id, npc);

        // Clean up when the NPC's agent is deleted by any other path
        npc.agent.emitter.once('deleted', async () => {
            if (this.#npcs.get(id) === npc) {
                this.#npcs.delete(id);
            }
            await npc.stop();
        });

        npc.start();
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
