import PluginBase from '../PluginBase.js';
import { config, configEmitter } from '../../config/config.js';
import { pluginRegistry } from '../runtime.js';
import MissionBase from './MissionBase.js';
import { createMission } from './handlers/index.js';

/**
 * Missions plugin: instantiates the mission script of the current game
 * (config.GAME.missions) into independent mission plugins. It owns only
 * their construction and disposal; each mission plugin subscribes directly
 * to its own game facts, timer and tournament lifecycle.
 *
 * Invalid script entries are reported loudly and skipped: a broken mission
 * never prevents the game from starting.
 */
class MissionsPlugin extends PluginBase {

    /** @type {import('./MissionBase.js').default[]} */
    #missions = [];

    /** @type {any[] | null} reference of the mission script currently instantiated */
    #missionsScript = null;

    /** @type {string | null} title of the game the current script was instantiated from */
    #missionsGameTitle = null;

    /** @type {() => void} */
    #onGameChanged = () => {
        const script = Array.isArray(config.GAME.missions) ? config.GAME.missions : [];
        // A new game re-instantiates the missions even when it carries no
        // script of its own (the array reference would be unchanged): a map
        // without missions must not inherit the missions of the previous map
        if (script === this.#missionsScript && config.GAME.title === this.#missionsGameTitle) {
            return;
        }
        void this.#instantiate(script);
    };

    constructor() {
        super({
            id: 'missions',
            name: 'Missions',
            version: '1.1.0',
            description: 'Scripted missions from the game configuration: bonuses, penalties and chat prompts'
        });
    }

    /**
     * @param {import('../PluginBase.js').PluginContext} context
     * @returns {Promise<boolean>}
     */
    async init(context) {
        const script = Array.isArray(config.GAME.missions) ? config.GAME.missions : [];
        this.#missionsScript = script;
        await this.#instantiate(script);
        configEmitter.on('GAME', this.#onGameChanged);

        console.log(`[Missions] Started with ${this.#missions.length} mission(s) from the game script`);
        return true;
    }

    /**
     * @param {import('../PluginBase.js').PluginContext} context
     * @returns {Promise<boolean>}
     */
    async shutdown(context) {
        void context;
        configEmitter.off('GAME', this.#onGameChanged);

        await this.#disposeMissions();
        this.#missionsScript = null;
        this.#missionsGameTitle = null;
        console.log('[Missions] Stopped');
        return true;
    }

    /**
     * Replace the live missions with the ones of the given script: the old
     * missions are disposed, the new ones scheduled (each after its own
     * startAfter delay) and their prompts announced in chat by the
     * mission-master as soon as they become active.
     * @param {any[]} script
     */
    async #instantiate(script) {
        await this.#disposeMissions();

        this.#missionsScript = script;
        this.#missionsGameTitle = config.GAME.title;
        script.forEach((descriptor, index) => {
            try {
                const mission = createMission(descriptor, index);
                pluginRegistry.register(mission);
                this.#missions.push(mission);
            } catch (error) {
                console.warn(`⚠️ [Missions] Skipping invalid mission at index ${index}: ${error.message}`);
            }
        });

        for (const mission of this.#missions) {
            const started = await pluginRegistry.start(mission.id);
            if (!started) {
                console.warn(`⚠️ [Missions] ${mission.type}#${mission.index} failed to start: ${mission.lastError ?? 'unknown error'}`);
            }
        }

        console.log(`[Missions] ${this.#missions.length} mission(s) instantiated from the game script`);
    }

    /**
     * Dispose every live mission, isolating failures.
     */
    async #disposeMissions() {
        for (const mission of this.#missions) {
            try {
                await pluginRegistry.unregister(mission.id);
            } catch (error) {
                console.warn(`⚠️ [Missions] ${mission.type}#${mission.index} dispose failed: ${error.message}`);
            }
        }
        this.#missions = [];
    }

    /**
     * REST-facing description of the active missions.
     * @returns {object[]}
     */
    describeMissions() {
        return this.#missions.map((mission) => mission.describe());
    }

}

export default MissionsPlugin;
