/**
 * AgentHandlers - Manages agent connection/disconnection broadcasting
 *
 * Responsibilities:
 * - Emit existing agents on connection
 * - Listen for new agent connections
 * - Listen for agent disconnections
 * - Cleanup on disconnect
 */

import { myGrid } from '../../myGrid.js';

/**
 * Setup controller connection/disconnection handlers
 * @param {import('@unitn-asa/deliveroo-js-sdk/server').DjsServer} server - Enhanced socket
 */
export function broadcastControllersConnections(server) {
    try {
        // Emit existing agents
        Array.from(myGrid.agentRegistry.getIterator()).forEach((agent) => {
            try {
                if (!agent?.id) return;
                const { id, name, teamName, teamId, score } = agent;
                server.emit('controller', 'connected', { id, name, teamName, teamId, score });
            } catch (error) {
                console.warn(`[${import.meta.filename}] Error emitting controller:`, error.message);
            }
        });

        // Listen for new agents
        const agentCreatedListener = (event, agent) => {
            try {
                if (!agent?.id) return;
                const { id, name, teamName, teamId, score } = agent;
                server.emit('controller', 'connected', { id, name, teamName, teamId, score });
            } catch (error) {
                console.warn(`[${import.meta.filename}] Error in agent created listener:`, error.message);
            }
        };
        myGrid.emitter.onAgentCreated(agentCreatedListener);

        // Listen for deleted agents
        const agentDeletedListener = (event, agent) => {
            try {
                if (!agent?.id) return;
                const { id, name, teamName, teamId, score } = agent;
                server.emit('controller', 'disconnected', { id, name, teamName, teamId, score });
            } catch (error) {
                console.warn(`[${import.meta.filename}] Error in agent deleted listener:`, error.message);
            }
        };
        myGrid.emitter.onAgentDeleted(agentDeletedListener);

        console.log(`[${import.meta.filename}] Controller connection status broadcasting setup complete`);
    } catch (error) {
        console.error(`[${import.meta.filename}] Error setting up agent emission:`, error.message);
    }
}
