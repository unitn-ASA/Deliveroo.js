/**
 * SensingHandlers - Manages sensing data updates
 *
 * Responsibilities:
 * - Trigger initial sensing computation on connection
 * - Listen for sensing updates from agent sensor
 * - Cleanup on disconnect
 */

/**
 * Setup sensing handlers
 * @param {import('@unitn-asa/deliveroo-js-sdk/server').DjsServerSocket} socket - Enhanced socket
 * @param {import('../../core/Agent.js').default} agent - Agent instance
 */
export function emitSensing(socket, agent) {
    try {
        // Listen for sensing updates
        const sensingListener = (sensing) => {
            try {
                socket.emitSensing(sensing);
            } catch (error) {
                console.warn('[SensingHandlers] Error emitting sensing:', error.message);
            }
        };
        agent.sensor.emitter.on('sensing', sensingListener);

        // Trigger computeSensing() to emit initial sensing on connection
        agent.sensor.computeSensing();

        console.log('[SensingHandlers] Sensing updates setup complete');

        // Cleanup listeners on disconnect
        socket.onDisconnect(() => {
            agent.sensor.emitter.off('sensing', sensingListener);
        });
    } catch (error) {
        console.error('[SensingHandlers] Error setting up sensing:', error.message);
    }
}

export default emitSensing;
