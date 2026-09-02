import { myGrid } from '../../myGrid.js';
import { deleteAgentWhenNoConnectionsLeft } from '../connections/deleteAgentWhenNoConnectionsLeft.js';
import { disconnectWhenPenaltyExceeded } from '../connections/disconnectWhenPenaltyExceeded.js';
import { emitYou } from '../emitters/emitYou.js';
import { emitSensing } from '../emitters/emitSensing.js';
import { handleActions } from '../handlers/handleActions.js';

/**
 * Per-connection behavior for identities that play as an agent.
 *
 * Orchestrates the existing emitters/handlers unchanged: cleanup stays
 * self-wired inside them (onDisconnect / untilDisconnect), so this
 * component only starts things.
 */
class PlayerConnectionComponent {

    id = 'player-connection';

    /**
     * @param {import('@unitn-asa/deliveroo-js-sdk/server').DjsServerSocket} socket
     * @param {import('../../deliveroo/Identity.js').default} identity
     * @returns {Promise<boolean>} false when the agent could not be created
     */
    async start(socket, identity) {

        // Join agent- and team-scoped rooms BEFORE anything that counts
        // sockets in them (deleteAgentWhenNoConnectionsLeft)
        await socket.join("agent:" + identity.id);
        await socket.join("team:" + identity.teamId);

        // Create Agent entity on map
        const me = myGrid.agentRegistry.get(identity.id) || myGrid.createAgent(identity);
        if (!me) {
            console.error(`Failed to get or create agent for ${identity.id}`);
            return false;
        }

        // Turn on sensing for this agent
        me.sensor.turnOn();

        // Setup connection lifecycle handlers
        deleteAgentWhenNoConnectionsLeft(socket, me);

        // Setup penalty-based auto-kick
        disconnectWhenPenaltyExceeded(socket, me);

        // "Me" state updates
        emitYou(socket, me);

        // Sensing updates
        emitSensing(socket, me);

        // Setup action handlers (dispatched through the agent command bus)
        handleActions(socket, me);

        return true;
    }

}

export default PlayerConnectionComponent;
