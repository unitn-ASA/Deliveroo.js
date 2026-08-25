import { config, configEmitter } from '../../config/config.js';

/**
 * LogBroadcaster - Manages client and server log broadcasting
 *
 * Responsibilities:
 * - Client log broadcasting (forward client logs to other clients)
 * - Server log broadcasting (handled globally in ioServer.js)
 */

/**
 * Setup client log broadcasting
 * @private
 * @param {import('@unitn-asa/deliveroo-js-sdk/server').DjsServerSocket} socket - Enhanced socket
 * @param {import('../../deliveroo/Identity.js').default} identity - Identity instance
 */
export function handleClientsLogAndBroadcastToAdmins(socket, identity) {
    try {
        // Log listener - broadcasts client logs to other clients
        const logListener = (...message) => {
            try {
                socket.to('admins').emit('log', {
                    socket: socket.id,
                    id: identity.id,
                    name: identity.name
                }, ...message);
            } catch (error) {
                console.warn('Error broadcasting log:', error.message);
            }
        };

        // Config listener - enables/disables client log broadcasting based on config
        const configListener = (v) => {
            try {
                if (v && !socket.listeners('log').includes(logListener)) {
                    socket.on('log', logListener);
                } else {
                    socket.off('log', logListener);
                }
            } catch (error) {
                console.warn('Error in config listener for logs:', error.message);
            }
        };

        // Listen for config changes
        configEmitter.on('BROADCAST_LOGS', configListener);

        // Initial setup based on current config
        configListener(config.BROADCAST_LOGS);

        // Cleanup listeners on disconnect
        socket.onDisconnect(() => {
            socket.off('log', logListener);
            configEmitter.off('BROADCAST_LOGS', configListener);
        });
    } catch (error) {
        console.error('Error setting up log listener:', error.message);
    }
}
