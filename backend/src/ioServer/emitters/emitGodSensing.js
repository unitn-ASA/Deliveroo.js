import { atNextTick } from '../../reactivity/postponeAt.js';
import { myGrid } from '../../myGrid.js';

/**
 * GodSensingHandlers - Map-wide sensing for agent-less observers (admins).
 *
 * Emits the same 'sensing' payload the per-agent Sensor produces for
 * unlimited observation, but built directly from the grid registries:
 * on any game-state fact a fresh full snapshot is emitted, debounced at
 * the next tick so bursts collapse into a single update.
 */

/**
 * Setup map-wide god sensing updates for an agent-less observer.
 * @param {import('@unitn-asa/deliveroo-js-sdk/server').DjsServerSocket} socket - Enhanced socket
 */
export function emitGodSensing(socket) {
    try {
        // Full snapshot; payload shapes mirror the Sensor positionless path
        const snapshot = () => {
            const positions = [];
            for (const tile of myGrid.tileRegistry.getIterator()) {
                positions.push({ x: tile.x, y: tile.y });
            }

            const agents = [];
            for (const a of myGrid.agentRegistry.getIterator()) {
                agents.push({
                    id: a.id,
                    name: a.name,
                    teamId: a.teamId,
                    teamName: a.teamName,
                    x: a.x,
                    y: a.y,
                    score: a.score,
                    penalty: a.penalty,
                    rotation: a.rotation
                });
            }

            const parcels = [];
            for (const p of myGrid.parcelRegistry.getIterator()) {
                parcels.push({
                    id: p.id,
                    x: p.x,
                    y: p.y,
                    carriedBy: p.carriedBy ? p.carriedBy.id : null,
                    reward: p.reward
                });
            }

            const crates = [];
            for (const c of myGrid.crateRegistry.getIterator()) {
                crates.push({ id: c.id, x: c.x, y: c.y });
            }

            return { positions, agents, parcels, crates };
        };

        // Re-snapshot on any game-state fact, debounced at the next tick
        const emitSnapshot = atNextTick(() => {
            try {
                socket.emitSensing(snapshot());
            } catch (error) {
                console.warn('[emitGodSensing] Error emitting sensing:', error.message);
            }
        });

        myGrid.emitter.onTile(emitSnapshot);
        myGrid.emitter.onParcel(emitSnapshot);
        myGrid.emitter.onCrate(emitSnapshot);
        myGrid.emitter.onAgentCreated(emitSnapshot);
        myGrid.emitter.onAgentXy(emitSnapshot);
        myGrid.emitter.onAgentScore(emitSnapshot);
        myGrid.emitter.onAgentDeleted(emitSnapshot);

        // Initial map-wide snapshot on connection
        socket.emitSensing(snapshot());

        console.log('[emitGodSensing] God sensing updates setup complete');

        // Cleanup listeners on disconnect
        socket.onDisconnect(() => {
            myGrid.emitter.offTile(emitSnapshot);
            myGrid.emitter.offParcel(emitSnapshot);
            myGrid.emitter.offCrate(emitSnapshot);
            myGrid.emitter.offAgentCreated(emitSnapshot);
            myGrid.emitter.offAgentXy(emitSnapshot);
            myGrid.emitter.offAgentScore(emitSnapshot);
            myGrid.emitter.offAgentDeleted(emitSnapshot);
        });
    } catch (error) {
        console.error('[emitGodSensing] Error setting up god sensing:', error.message);
    }
}

export default emitGodSensing;
