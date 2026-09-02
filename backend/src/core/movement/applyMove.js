import { config } from '../../config/config.js';

/**
 * Execute one movement command under the agent action mutex and acknowledge once.
 * The movement behavior is supplied by the active command plugin.
 * @param {import('../Agent.js').default} agent
 * @param {'up'|'down'|'left'|'right'} direction
 * @param {(agent: import('../Agent.js').default, direction: 'up'|'down'|'left'|'right', grid: import('../Grid.js').default) => Promise<any>} move
 * @param {string} owner
 * @param {(result: any) => void} [ack]
 * @returns {Promise<any>}
 */
async function applyMove(agent, direction, move, owner, ack) {
    let result;
    try {
        result = await agent.actionMutex.execute(() => move(agent, direction, agent.grid));
    } catch (error) {
        console.error(`[movement:${owner}] Move error for ${agent.name}(${agent.id}):`, error.message);
        agent.penalty -= config.PENALTY;
        result = false;
    }
    if (ack) ack(result);
    return result;
}

export { applyMove };
