import PluginBase from '../PluginBase.js';
import myClock from '../../myClock.js';
import { config } from '../../config/config.js';

/**
 * Spawns parcels on parcel-spawner tiles at the configured generation rate.
 * While running, it self-schedules on the clock; stopping cancels the
 * pending schedule, so spawning halts cleanly and resumes on restart.
 */
class ParcelSpawnerPlugin extends PluginBase {

    /** @type {(() => void) | null} stable listener reference, needed for cancellation */
    #tick = null;

    /**
     * Event name the current schedule is pending on, or null when no
     * schedule is pending (stopped, or generation_event is the 'infinite'
     * sentinel: generation never triggers again).
     * @type {import('@unitn-asa/deliveroo-js-sdk/types/IOClockEvent.js').IOClockEvent | null}
     */
    #scheduledEvent = null;

    constructor() {
        super({
            id: 'parcel-spawner',
            name: 'Parcel Spawner',
            version: '1.0.0',
            description: 'Spawns parcels on spawner tiles at the configured generation rate'
        });
    }

    /**
     * @param {import('../PluginBase.js').PluginContext} context
     * @returns {Promise<boolean>}
     */
    async init(context) {
        this.#tick = () => this.#spawnAndSchedule(context);
        this.#spawnAndSchedule(context);
        console.log('[ParcelSpawnerPlugin] Parcel spawning started');
        return true;
    }

    /**
     * @param {import('../PluginBase.js').PluginContext} context
     * @returns {Promise<boolean>}
     */
    async shutdown(context) {
        void context;
        if (this.#tick && this.#scheduledEvent) {
            myClock.off(this.#scheduledEvent, this.#tick);
        }
        this.#tick = null;
        this.#scheduledEvent = null;
        console.log('[ParcelSpawnerPlugin] Parcel spawning stopped');
        return true;
    }

    #spawnAndSchedule(context) {
        this.#spawn(context);
        // Read the event at scheduling time so config changes take effect on the next spawn
        const scheduledEvent = config.GAME.parcels.generation_event;
        if (scheduledEvent === 'infinite') {
            // 'infinite' is not a clock event: generation never triggers
            // again, the spawner stays idle
            this.#scheduledEvent = null;
            return;
        }
        this.#scheduledEvent = scheduledEvent;
        myClock.once(this.#scheduledEvent, this.#tick);
    }

    /**
     * @param {import('../PluginBase.js').PluginContext} context
     */
    #spawn(context) {
        const grid = context.grid;
        if (grid.parcels.getSize() >= config.GAME.parcels.max) {
            return;
        }
        const tilesWithNoParcels = this.#tilesWithNoParcels(grid);
        if (tilesWithNoParcels.length > 0) {
            const tile = tilesWithNoParcels.at(Math.floor(Math.random() * tilesWithNoParcels.length));
            if (tile && tile.xy) {
                grid.createParcel(tile.xy);
            }
        }
    }

    /**
     * @param {import('../../core/Grid.js').default} grid
     * @returns {import('../../core/Tile.js').default[]}
     */
    #tilesWithNoParcels(grid) {
        return Array.from(grid.tiles.getIterator())
            // parcel spawner tile
            .filter((t) => t.parcelSpawner)
            // no parcels exists on the tile
            .filter((t) =>
                Array.from(grid.parcels.getIterator()).find((p) =>
                    p.x == t.x && p.y == t.y
                ) == undefined
            );
    }

}

export default ParcelSpawnerPlugin;
