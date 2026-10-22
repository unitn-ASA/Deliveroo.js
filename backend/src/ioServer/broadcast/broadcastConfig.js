import { config, configEmitter } from '../../config/config.js';

/**
 * Broadcast config updates to clients
 * @param {import('@unitn-asa/deliveroo-js-sdk/server').DjsServerSocket} socket - Enhanced IO server
 * @param {import('../../core/Identity.js').default} identity - Agent identity
 */
export function broadcastConfig(socket, identity) {

    const emitConfig = () => {
        try {
            const _config = {
                CLOCK: config.CLOCK,
                AGENT_TIMEOUT: config.AGENT_TIMEOUT,
                BROADCAST_LOGS: config.BROADCAST_LOGS,
                GAME: config.GAME
            };
            // The mission script holds the answers (e.g. questionAnswer):
            // agents only get the announced prompts, so the script is
            // stripped from the configuration they receive. Admins keep
            // the full game (the level editor needs to re-send it).
            if (identity?.role !== 'admin') {
                _config.GAME = { ...config.GAME, missions: undefined };
            }
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
