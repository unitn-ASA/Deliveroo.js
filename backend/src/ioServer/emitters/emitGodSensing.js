import { atPromise } from '../../reactivity/postponeAt.js';
import { myGrid } from '../../myGrid.js';
import myClock from '../../myClock.js';

/**
 * GodSensingHandlers - Map-wide sensing for agent-less observers (admins).
 *
 * Emits the same 'sensing' payload the per-agent Sensor produces for
 * unlimited observation, but built directly from the grid registries:
 * on any game-state fact a fresh full snapshot is emitted, once per clock
 * frame so bursts collapse into a single update.
 */

/**
 * Setup map-wide god sensing updates for an agent-less observer.
 * @param {import('@unitn-asa/deliveroo-js-sdk/server').DjsServerSocket} socket - Enhanced socket
 */
export function emitGodSensing(socket) {
    try {
        // Tile positions are static between map edits, so do not rebuild them
        // for every agent movement.
        let positions = [];
        let positionsDirty = true;
        const refreshPositions = () => {
            for (const tile of myGrid.tiles.getIterator()) {
                positions.push({ x: tile.x, y: tile.y });
            }
            positionsDirty = false;
        };

        // Full snapshot; payload shapes mirror the Sensor positionless path
        const snapshot = () => {
            if (positionsDirty) {
                positions = [];
                refreshPositions();
            }

            const agents = [];
            for (const a of myGrid.agents.getIterator()) {
                agents.push({
                    id: a.id,
                    name: a.name,
                    teamId: a.teamId,
                    teamName: a.teamName,
                    x: a.x,
                    y: a.y,
                    score: a.score,
                    penalty: a.penalty,
                    rotation: a.rotation,
                    attributes: a.attributes.toArray()
                });
            }

            const parcels = [];
            for (const p of myGrid.parcels.getIterator()) {
                parcels.push({
                    id: p.id,
                    x: p.x,
                    y: p.y,
                    carriedBy: p.carriedBy ? p.carriedBy.id : null,
                    reward: p.reward
                });
            }

            const crates = [];
            for (const c of myGrid.crates.getIterator()) {
                crates.push({ id: c.id, x: c.x, y: c.y });
            }

            // All plugin-owned entities
            const entities = [];
            for (const layer of myGrid.getEntityLayers()) {
                for (const entity of layer.getIterator()) {
                    entities.push(entity.toIO());
                }
            }

            return { frame: myClock.frame, positions, agents, parcels, crates, entities };
        };

        let disconnected = false;

        // Re-snapshot on any game-state fact, but emit at most once per frame.
        let emitSnapshot;
        const flushSnapshot = () => {
            if (disconnected) return;
            try {
                socket.emitSensing(snapshot());
            } catch (error) {
                console.warn('[emitGodSensing] Error emitting sensing:', error.message);
            }
            // atPromise consumes its promise, so schedule the next frame anew.
            emitSnapshot = atPromise(myClock.once('frame'), flushSnapshot);
        };
        emitSnapshot = atPromise(myClock.once('frame'), flushSnapshot);
        const requestSnapshot = () => emitSnapshot();
        const requestTileSnapshot = () => {
            positionsDirty = true;
            requestSnapshot();
        };

        const coreLayerListener = () => requestSnapshot();
        myGrid.tiles.onChanged(requestTileSnapshot);
        myGrid.parcels.onChanged(coreLayerListener);
        myGrid.crates.onChanged(coreLayerListener);
        myGrid.agents.onChanged(coreLayerListener);
        myGrid.onEntityLayerChanged(coreLayerListener);
        myGrid.emitter.on('mapLoaded', requestTileSnapshot);

        // Initial map-wide snapshot on connection
        socket.emitSensing(snapshot());

        console.log('[emitGodSensing] God sensing updates setup complete');

        // Cleanup listeners on disconnect
        socket.onDisconnect(() => {
            disconnected = true;
            myGrid.tiles.offChanged(requestTileSnapshot);
            myGrid.parcels.offChanged(coreLayerListener);
            myGrid.crates.offChanged(coreLayerListener);
            myGrid.agents.offChanged(coreLayerListener);
            myGrid.offEntityLayerChanged(coreLayerListener);
            myGrid.emitter.off('mapLoaded', requestTileSnapshot);
        });
    } catch (error) {
        console.error('[emitGodSensing] Error setting up god sensing:', error.message);
    }
}

export default emitGodSensing;
