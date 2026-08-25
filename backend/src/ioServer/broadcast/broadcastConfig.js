import { config, configEmitter } from '../../config/config.js';

/**
 * Broadcast config updates to clients
 * @param {import('@unitn-asa/deliveroo-js-sdk/server').DjsServerSocket} socket - Enhanced IO server
 */
export function broadcastConfig(socket) {

    const emitConfig = () => {
        try {
            const _config = {
                CLOCK: config.CLOCK,
                PENALTY: config.PENALTY,
                AGENT_TIMEOUT: config.AGENT_TIMEOUT,
                BROADCAST_LOGS: config.BROADCAST_LOGS,
                GAME: config.GAME
            };
            socket.emit('config', _config);
            console.log('[broadcastConfig] Emitted config update:', _config);
        } catch (error) {
            console.error('[broadcastConfig] Error emitting config:', error.message);
        }
    };

    // Notify clients of config change
    configEmitter.on('update', emitConfig);

    // Emit initial config on connection
    emitConfig();

}
