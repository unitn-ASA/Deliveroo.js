import PluginBase from '../PluginBase.js';

/**
 * @typedef {Object} LeaderboardItem
 * @property {string} agentId
 * @property {string} agentName
 * @property {number} score
 */

/**
 * Maintains a leaderboard from agent score facts (grid.emitter 'agent score').
 * Example of a plugin consuming game-state facts rather than commands.
 */
class LeaderboardPlugin extends PluginBase {

    /** @type {LeaderboardItem[]} sorted by score, descending */
    leaderboard = [];

    /** @type {(event: {object: import('../../core/Agent.js').default, type: string}) => void} */
    #handler = null;

    constructor() {
        super({
            id: 'leaderboard-plugin',
            name: 'Leaderboard Plugin',
            version: '1.0.0',
            description: 'Maintains a leaderboard from agent score updates'
        });
    }

    /**
     * @param {import('../PluginBase.js').PluginContext} context
     * @returns {Promise<boolean>}
     */
    async init(context) {
        this.#handler = ({ object, type }) => {
            if (type === 'changed' && object) this.#onAgentScore(object);
        };

        // Initialize from agents already on the grid
        for ( const agent of context.grid.agents.getIterator() ) {
            this.#onAgentScore(agent);
        }

        context.grid.agents.onChanged(this.#handler);
        console.log('[LeaderboardPlugin] Tracking agent scores');
        return true;
    }

    /**
     * @param {import('../../core/Agent.js').default} agent
     */
    #onAgentScore(agent) {
        if (!agent.id) {
            return;
        }

        /** @type {LeaderboardItem[]} */
        const list = this.leaderboard.filter((item) => item.agentId !== agent.id);
        list.push({ agentId: agent.id, agentName: agent.name, score: agent.score });
        list.sort((a, b) => b.score - a.score);

        this.leaderboard = list;
    }

    /**
     * @param {import('../PluginBase.js').PluginContext} context
     * @returns {Promise<boolean>}
     */
    async shutdown(context) {
        context.grid.agents.offChanged(this.#handler);
        return true;
    }

    /**
     * @returns {import('../PluginBase.js').PluginStatus & {leaderboard: LeaderboardItem[]}}
     */
    getStatus() {
        return {
            ...super.getStatus(),
            leaderboard: this.leaderboard.slice(0, 10)
        };
    }

}

export default LeaderboardPlugin;
