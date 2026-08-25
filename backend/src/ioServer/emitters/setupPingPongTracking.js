import { config } from '../../config/config.js';
import myClock from '../../myClock.js';
import myPerformanceMonitor from '../../myPerformanceMonitor.js';

/**
 * Setup ping/pong latency tracking
 * @param {import('@unitn-asa/deliveroo-js-sdk/server').DjsServerSocket} socket - Enhanced socket
 * @param {import('../../deliveroo/Identity.js').default} identity - Agent identity
 */
export function setupPingPongTracking(socket, identity) {
    try {
        const PING_INTERVAL = 1000; // Send ping every 1 second

        // Timestamp and frame at ping time
        let timestampAtPing;
        let frameAtPing = myClock.frame;

        // Previous latency data to send with ping
        let lastLatencyData = {
            socketId: socket.id,
            id: identity.id,
            name: identity.name,
            teamId: identity.teamId,
            teamName: identity.teamName,
            frame: myClock.frame,
            roundTrip: -1
        };

        // Send periodic pings with acknowledgement callback
        const pingInterval = setInterval(() => {
            try {
                // Timestamp and frame at ping time
                timestampAtPing = performance.now();
                frameAtPing = myClock.frame;

                // Send ping with previous latency data
                socket.emit(
                    'ping',
                    { frame: lastLatencyData.frame, roundTrip: lastLatencyData.roundTrip },
                    () => {
                        // When pong is received
                        try {
                            // Update latencyData with current roundTrip and frame
                            lastLatencyData.roundTrip = Math.round(performance.now() - timestampAtPing);
                            lastLatencyData.frame = frameAtPing;

                            // Store latency data in performance monitor
                            myPerformanceMonitor.handlePong(lastLatencyData);

                            // Optional: log high latency
                            if (lastLatencyData.roundTrip > 200) {
                                console.log(
                                    `${identity.name}-${identity.teamName}-${identity.id} High latency: ${lastLatencyData.roundTrip}ms`
                                );
                            }
                        } catch (error) {
                            console.warn('Error handling ping acknowledgement:', error.message);
                        }
                    }
                );
            } catch (error) {
                console.warn('Error sending ping:', error.message);
            }
        }, PING_INTERVAL);

        // Cleanup ping interval on disconnect
        socket.onDisconnect(() => {
            clearInterval(pingInterval);
        });
    } catch (error) {
        console.warn('Error setting up ping/pong:', error.message);
    }
}

