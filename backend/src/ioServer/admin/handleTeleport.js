import { myGrid } from '../../myGrid.js';
import Xy from '../../core/Xy.js';

const logPrefix = '[TeleportHandlers]';

/**
 * Setup admin handlers to teleport any agent.
 *
 * @param {import('@unitn-asa/deliveroo-js-sdk/server').DjsServerSocket} socket - Socket instance
 * @param {object} identity - Identity object
 */
export function handleTeleport(socket, identity) {

    console.log(`${logPrefix} Setting up teleport handlers for ${identity.name}`);

    socket.on('agent:teleport', async ( agentId, {x, y}, ack ) => {

        // Verify role
        if (identity.role !== 'admin') {
            console.warn(`${logPrefix} Unauthorized teleport attempt by ${identity.name}`);
            if (ack) ack({ success: false, error: 'Unauthorized' });
            return;
        }

        const agent = myGrid.agentRegistry.get(agentId);
        if (!agent) {
            console.warn(`${logPrefix} Agent ${agentId} not found`);
            if (ack) ack({ success: false, error: 'Agent not found' });
            return;
        }

        const newxy = new Xy(x, y);
        const tile = myGrid.tileRegistry.getOneByXy(newxy);

        if (!tile || !tile.walkable) {
            console.warn(`${logPrefix} Invalid destination (${x}, ${y})`);
            if (ack) ack({ success: false, error: 'Invalid destination' });
            return;
        }

        try {
            // Unlock current tile
            if (agent.tile) {
                agent.tile.unlock();
            }

            // Set new position and lock tile
            agent.xy = newxy;
            tile.lock();

            console.log(`${logPrefix} ${identity.name} teleported ${agent.name} to (${x}, ${y})`);
            if (ack) ack({ success: true, position: { x, y } });

        } catch (error) {
            console.error(`${logPrefix} Teleport error:`, error.message);
            if (ack) ack({ success: false, error: error.message });
        }
    });

    console.log(`✅ ${logPrefix} Teleport handlers setup complete for ${identity.name}`);
}
