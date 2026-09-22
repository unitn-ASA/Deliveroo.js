import PluginBase from '../PluginBase.js';
import { actionHooks } from '../../core/actions/ActionHooks.js';
import EntityLayer from '../../core/EntityLayer.js';

/** Tile types owned by this plugin */
const isDoor = (tile) => tile?.type === '7';
const isKeySpawner = (tile) => tile?.type === '8';

/**
 * Keys & Doors plugin: key entities, key spawners and door entities.
 *
 * Provides:
 * - keys as plugin-owned entities ('key') on key-spawner tiles
 *   ('8'), used as an infinite source: picking a key immediately replaces
 *   it on the tile, so every agent always finds one available; picked keys
 *   go to the plugin-owned per-agent key attribute ('key' in
 *   sensing.self.attributes), exposed through a self-sensing provider
 * - doors as plugin-owned entities ('door') materialized on
 *   door tiles ('7'), kept in sync with tile edits and map changes
 * - door gate through the action hook pipeline: entering a door tile
 *   requires a key, which is consumed on crossing
 *
 * On 'map loaded' (map change or restart) both layers resync with the
 * current map.
 */
class KeysDoorsPlugin extends PluginBase {

    /** @type {import('../../core/Grid.js').default | null} */
    #grid = null;

    /** @type {EntityLayer} plugin-owned key entities */
    #keys = new EntityLayer({
        id: 'keysDoors:keys'
    });

    /** @type {EntityLayer} plugin-owned door entities */
    #doors = new EntityLayer({
        id: 'keysDoors:doors'
    });

    #agentCreatedListener = ({ object, type }) => {
        if (type === 'added' && object.attributes.get('key') === undefined) object.attributes.set('key', 0);
    };

    #tileListener = ({ object }) => {
        if (object) this.#syncDoorTile(object);
    };

    /** @type {() => void} resync with the (new) map: refill key spawners, rebuild doors */
    #mapLoadedListener = () => {
        this.#keys.clear();
        this.#doors.clear();
        this.#spawnKeys();
        this.#syncDoors();
    };

    constructor() {
        super({
            id: 'keys-doors',
            name: 'Keys & Doors',
            version: '1.0.0',
            description: 'Key items on \"8\" tiles as an infinite source, door entities on \"7\" tiles consuming a key on crossing'
        });
    }

    /**
     * @param {import('../PluginBase.js').PluginContext} context
     * @returns {Promise<boolean>}
     */
    async init(context) {
        const grid = context.grid;
        this.#grid = grid;

        // Initialize the key attribute of agents created before this plugin
        // started (e.g. NPCs), adopting any configuration seed.
        for (const agent of grid.agents.getIterator()) {
            if (agent.attributes.get('key') === undefined) agent.attributes.set('key', 0);
        }

        // Expose keys and doors to the sensing pipeline.
        grid.registerEntityLayer(this.#keys);
        grid.registerEntityLayer(this.#doors);
        grid.agents.onChanged(this.#agentCreatedListener);
        grid.tiles.onChanged(this.#tileListener);
        grid.emitter.on('mapLoaded', this.#mapLoadedListener);

        // Action hooks: door gate and key consumption around the invariant core move
        actionHooks.beforeMove('keys-doors', 20, (ctx) => this.#gateDoor(ctx));
        actionHooks.afterMove('keys-doors', 20, (ctx) => this.#consumeKey(ctx));
        actionHooks.pickup('keys-doors', 20, (ctx) => this.#pickKey(ctx));

        // Initial fill
        this.#spawnKeys();
        this.#syncDoors();

        console.log('[KeysDoorsPlugin] Keys & Doors started: key spawners and door entities active');
        return true;
    }

    /**
     * @param {import('../PluginBase.js').PluginContext} context
     * @returns {Promise<boolean>}
     */
    async shutdown(context) {
        const grid = context.grid;

        actionHooks.offBeforeMove('keys-doors');
        actionHooks.offAfterMove('keys-doors');
        actionHooks.offPickup('keys-doors');

        grid.agents.offChanged(this.#agentCreatedListener);
        grid.tiles.offChanged(this.#tileListener);
        grid.emitter.off('mapLoaded', this.#mapLoadedListener);

        this.#keys.clear();
        this.#doors.clear();
        grid.unregisterEntityLayer(this.#keys.id);
        grid.unregisterEntityLayer(this.#doors.id);

        for (const agent of grid.agents.getIterator()) {
            agent.attributes.delete('key');
        }
        this.#grid = null;

        console.log('[KeysDoorsPlugin] Keys & Doors stopped');
        return true;
    }

    /**
     * Veto hook: entering a door tile requires a key (no penalty, no cost).
     * @param {import('../../core/actions/ActionHooks.js').MoveHookContext} ctx
     */
    #gateDoor({ agent, dx, dy, toTile }) {
        if (!isDoor(toTile)) return undefined;
        if (Number(agent.attributes.get('key')?.value ?? 0) <= 0) {
            console.warn(`${agent.name}(${agent.id}) move to (${agent.x + dx},${agent.y + dy}) failed: door locked (no key)`);
            return false;
        }
    }

    /**
     * After-move hook: crossing a door tile consumes one key.
     * @param {import('../../core/actions/ActionHooks.js').MoveHookContext} ctx
     */
    #consumeKey({ agent, toTile }) {
        if (isDoor(toTile)) {
            this.#addKeys(agent, -1);
        }
    }

    /**
     * Intercepting pickup handler: a key increments the plugin-owned attribute
     * and the spawner tile is refilled immediately (infinite source).
     * @param {import('../../core/actions/ActionHooks.js').PickupHookContext} ctx
     */
    #pickKey({ agent, xy }) {
        const key = xy && this.#keys.getOneByXy(xy);
        if (!key) return undefined;
        key.delete();
        this.#addKeys(agent, 1);
        this.#spawnKeys();
        return { collected: 'key' };
    }

    /**
     * Add (or remove, with a negative quantity) key units and notify the
     * self-sensing pipeline.
     * @param {import('../../core/Agent.js').default} agent
     * @param {number} quantity
     */
    #addKeys(agent, quantity) {
        const current = Number(agent.attributes.get('key')?.value ?? 0);
        agent.attributes.set('key', Math.max(0, current + quantity));
    }

    /**
     * Spawn a key entity on every empty key-spawner tile, so a picked key is
     * immediately replaced and other agents always find one available.
     */
    #spawnKeys() {
        if (!this.#grid) return;
        for (const tile of this.#grid.tiles.getIterator()) {
            if (!isKeySpawner(tile)) continue;
            if (this.#keys.getOneByXy(tile.xy)) continue;
            this.#keys.create({ kind: 'key', xy: tile.xy });
        }
    }

    /**
     * Create a door entity on every door tile ('7') and remove orphaned ones.
     */
    #syncDoors() {
        if (!this.#grid) return;
        for (const tile of this.#grid.tiles.getIterator()) {
            this.#syncDoorTile(tile);
        }
    }

    /**
     * Keep the door entity of a single tile in sync with its type.
     * @param {import('../../core/Tile.js').default} tile
     */
    #syncDoorTile(tile) {
        if (!this.#grid) return;
        const existing = this.#doors.getOneByXy(tile.xy);
        if (isDoor(tile)) {
            if (!existing) {
                this.#doors.create({ kind: 'door', xy: tile.xy });
            }
        } else if (existing?.kind === 'door') {
            existing.delete();
        }
    }

}

export default KeysDoorsPlugin;
