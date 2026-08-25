import myPerformanceMonitor from '../../myPerformanceMonitor.js';

/**
 * Setup admin metrics broadcasting
 * @param {import('@unitn-asa/deliveroo-js-sdk/server').DjsServer} server - Enhanced socket
 */
export function broadcastMetrics(server) {
    try {
        console.log(`[${import.meta.filename}] Setting up metrics broadcaster`);

        // Broadcast metrics every second
        setInterval(() => {
            try {
                const metrics = myPerformanceMonitor.getPerformanceMetrics();
                server.to('admins').emit('metrics', metrics);
            } catch (error) {
                console.warn(`[${import.meta.filename}] Error sending metrics:`, error.message);
            }
        }, 1000);

    } catch (error) {
        console.warn(`[${import.meta.filename}] Error setting up metrics:`, error.message);
    }
}
