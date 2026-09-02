
/**
 * Disconnect socket when penalty is exceeded
 * @param {import('@unitn-asa/deliveroo-js-sdk/server').DjsServerSocket} socket - Enhanced socket
 * @param {import('../../core/Agent.js').default} agent - Agent instance
 */
export function disconnectWhenPenaltyExceeded(socket, agent) {
    try {
        // Listen for penalty changes to auto-kick bad behaving agents
        const penaltyListener = () => {
            try {
                if (agent.penalty < -1000) {
                    console.log(
                        `${agent.name}-${agent.teamName}-${agent.id} is behaving too bad, automatically kicked with penalty ${agent.penalty}`
                    );
                    socket.disconnect();
                }
            } catch (error) {
                console.warn('Error in penalty listener:', error.message);
            }
        };

        agent.emitter.on('penalty', penaltyListener);

        // Cleanup listener to prevent memory leak
        socket.onDisconnect(() => {
            agent.emitter.off('penalty', penaltyListener);
        });
    } catch (error) {
        console.error('Error setting up penalty listener:', error.message);
    }
}
