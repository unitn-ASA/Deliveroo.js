/**
 * Disconnect the socket of an agent that collects too many warnings.
 */
const WARNINGS_KICK_THRESHOLD = 1000;

/**
 * Disconnect socket when the observable 'warnings' attribute exceeds the
 * threshold (Agent.addWarning). TODO: a rate-based kick (e.g. 100 warnings
 * per second) would be fairer than the absolute threshold.
 * @param {import('@unitn-asa/deliveroo-js-sdk/server').DjsServerSocket} socket - Enhanced socket
 * @param {import('../../core/Agent.js').default} agent - Agent instance
 */
export function disconnectWhenTooManyWarnings(socket, agent) {
    try {
        // Listen for attribute changes to auto-kick bad behaving agents
        const warningsListener = () => {
            try {
                const warnings = Number(agent.attributes.get('warnings')?.value ?? 0);
                if (warnings >= WARNINGS_KICK_THRESHOLD) {
                    console.log(
                        `${agent.name}-${agent.teamName}-${agent.id} is behaving too bad, automatically kicked with ${warnings} warnings`
                    );
                    socket.disconnect();
                }
            } catch (error) {
                console.warn('Error in warnings listener:', error.message);
            }
        };

        agent.emitter.on('attributes', warningsListener);

        // Cleanup listener to prevent memory leak
        socket.onDisconnect(() => {
            agent.emitter.off('attributes', warningsListener);
        });
    } catch (error) {
        console.error('Error setting up warnings listener:', error.message);
    }
}
