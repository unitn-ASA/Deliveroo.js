import { config } from '../../config/config.js';
import myPerformanceMonitor from '../../myPerformanceMonitor.js';

/**
 * Delete the agent when no sockets are left connected to it, with a timeout to allow for quick reconnections without losing the agent state.
 * @param {import('@unitn-asa/deliveroo-js-sdk/server').DjsServerSocket} socket - Enhanced socket
 * @param {import('../../core/Agent.js').default} agent - Agent instance
 */
export function deleteAgentWhenNoConnectionsLeft(socket, agent) {
    socket.onDisconnect(async (cause) => {
        // Clear latency samples for this socket
        myPerformanceMonitor.clearLatencySamples(socket.id);

        try {
            const socketsLeft = (await socket.to(`agent:${agent.id}`).fetchSockets()).length;

            console.log(
                `${agent.name}-${agent.teamName}-${agent.id} Socket disconnected.`,
                socketsLeft
                    ? `Other ${socketsLeft} connections to the agent.`
                    : `No other connections, agent will be removed in ${config.AGENT_TIMEOUT / 1000} seconds.`
            );

            if (socketsLeft === 0 && agent.xy) {
                // Stop sensing immediately to avoid unnecessary computations
                agent.sensor.turnOff();

                // Wait for potential reconnection before deleting agent
                await new Promise(resolve => setTimeout(resolve, config.AGENT_TIMEOUT));

                // Check again if there are connections before deleting agent
                const socketsLeftAfterTimeout = (await socket.to(`agent:${agent.id}`).fetchSockets()).length;
                if (socketsLeftAfterTimeout === 0 && agent.xy) {
                    console.log(
                        `${agent.name}-${agent.teamName}-${agent.id} Agent deleted after ${config.AGENT_TIMEOUT / 1000} seconds of no connections`
                    );
                    agent.delete();
                }
            }
        } catch (error) {
            console.error('Error in socket disconnect:', socket.id, '->', error);
        }
    });
}
