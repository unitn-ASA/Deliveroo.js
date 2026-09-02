import { atNextTick } from '../../reactivity/postponeAt.js';

/**
 * MeHandlers - Manages individual agent state updates
 *
 * Responsibilities:
 * - Emit initial "me" state (position, score, penalty, parcels)
 * - Listen for agent state changes (xy, score, penalty, carryingParcels)
 * - Debounce updates using atNextTick
 * - Cleanup on disconnect
 */

/**
 * Setup "me" state handlers
 * @param {import('@unitn-asa/deliveroo-js-sdk/server').DjsServerSocket} socket - Enhanced socket
 * @param {import('../../core/Agent.js').default} agent - Agent instance
 */
export function emitYou(socket, agent) {
    try {
        // Emit state updates (position, score, penalty, parcels, rotation)
        const meAnyListener = atNextTick(() => {
            try {
                socket.emitYou({
                    id: agent.id,
                    name: agent.name,
                    teamId: agent.teamId,
                    teamName: agent.teamName,
                    x: agent.x,
                    y: agent.y,
                    score: agent.score,
                    penalty: agent.penalty,
                    rotation: agent.rotation ?? null
                });
            } catch (error) {
                console.warn('[emitYou] Error emitting me update:', error.message);
            }
        });

        // Listen for changes
        agent.emitter.on('xy', meAnyListener);
        agent.emitter.on('score', meAnyListener);
        agent.emitter.on('penalty', meAnyListener);
        agent.emitter.on('carryingParcels', meAnyListener);
        agent.emitter.on('rotation', meAnyListener);

        // Emit initial state
        meAnyListener();

        console.log('[emitYou] Agent state updates setup complete');

        // Cleanup listeners on disconnect
        socket.onDisconnect(() => {
            agent.emitter.off('xy', meAnyListener);
            agent.emitter.off('score', meAnyListener);
            agent.emitter.off('penalty', meAnyListener);
            agent.emitter.off('carryingParcels', meAnyListener);
            agent.emitter.off('rotation', meAnyListener);
        });
    } catch (error) {
        console.error('[emitYou] Error setting up me emission:', error.message);
    }
}

export default emitYou;
