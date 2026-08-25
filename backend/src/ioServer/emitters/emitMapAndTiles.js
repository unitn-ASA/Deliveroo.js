import { myGrid } from '../../myGrid.js';

/**
 * MapHandlers - Manages map/tiles broadcasting
 *
 * Responsibilities:
 * - Initial map state emission (all tiles)
 * - Tile update events from Grid
 * - Cleanup on disconnect
 */

/**
 * Setup map/tiles handlers
 * @param {import('@unitn-asa/deliveroo-js-sdk/server').DjsServerSocket} socket - Enhanced socket
 */
export function emitMapAndTiles(socket) {
    try {
        // Emit tile updates
        const tileListener = ({ xy: { x, y }, type }) => {
            try {
                socket.emitTile({ x, y, type });
            } catch (error) {
                console.warn('[MapHandlers] Error emitting tile update:', error.message);
            }
        };
        myGrid.emitter.onTile(tileListener);

        // Emit all tiles for initial map state
        const tiles = [];
        for (const { xy: { x, y }, type } of myGrid.tileRegistry.getIterator()) {
            try {
                socket.emitTile({ x, y, type });
                tiles.push({ x, y, type });
            } catch (error) {
                console.warn('[MapHandlers] Error emitting initial tile:', error.message);
            }
        }

        // Emit initial map state as bulk
        socket.emitMap(myGrid.tileRegistry.getMaxX(), myGrid.tileRegistry.getMaxY(), tiles);

        console.log('[MapHandlers] Map broadcasting setup complete');

        // Cleanup listeners on disconnect
        socket.onDisconnect(() => {
            myGrid.emitter.offTile(tileListener);
        });
    } catch (error) {
        console.error('[MapHandlers] Error setting up map emission:', error.message);
    }
}

export default emitMapAndTiles;
