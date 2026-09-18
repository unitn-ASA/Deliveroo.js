import PluginBase from '../PluginBase.js';
import myClock from '../../myClock.js';
import { config } from '../../config/config.js';
import { actionHooks } from '../../core/actions/ActionHooks.js';
import EntityLayer from '../../core/EntityLayer.js';

/** Battery-spawner tile type owned by this plugin */
const isBatterySpawner = (tile) => tile?.type === '6';

/**
 * Energy plugin: agent energy resource, batteries and action costs.
 *
 * Provides:
 * - the 'energy' agent attribute, kept as plugin-owned per-agent
 *   state and exposed through sensing.self via a self-sensing
 *   provider
 * - batteries as plugin-owned entities ('battery') filling
 *   battery-spawner tiles ('6') at the configured generation rate; picking
 *   one up restores the initial energy
 * - action costs through the action hook pipeline: every successful move,
 *   parcel pickup and putdown costs energy; an exhausted agent cannot move
 * - passive energy recharge on the configured clock event
 *
 * World objects live in a plugin-owned SpatialLayer; the core Sensor emits
 * them through sensing.entities. On 'map loaded' (map change or restart) the
 * layer resyncs with the current map.
 */
class EnergyPlugin extends PluginBase {

    /** @type {import('../../core/Grid.js').default | null} */
    #grid = null;

    /** @type {EntityLayer} plugin-owned battery entities */
    #batteries = new EntityLayer({
        id: 'energy:batteries'
    });

    /** @type {(() => void) | null} battery spawner self-scheduling listener */
    #batteryTick = null;

    /** @type {import('@unitn-asa/deliveroo-js-sdk/types/IOClockEvent.js').IOClockEvent | null} clock event the battery spawn is pending on */
    #batteryEvent = null;

    /** @type {(() => void) | null} energy recharge self-scheduling listener */
    #rechargeTick = null;

    /** @type {import('@unitn-asa/deliveroo-js-sdk/types/IOClockEvent.js').IOClockEvent | null} clock event the recharge is pending on */
    #rechargeEvent = null;

    #agentCreatedListener = ({ object, type }) => {
        if (type === 'added') this.#initAgent(object);
    };

    /** @type {() => void} resync with the (new) map: refill battery spawner tiles */
    #mapLoadedListener = () => {
        this.#batteries.clear();
        this.#spawnBatteries();
    };

    constructor() {
        super({
            id: 'energy',
            name: 'Energy',
            version: '1.0.0',
            description: 'Agent energy resource, batteries on "6" tiles, action costs and passive recharge'
        });
    }

    /**
     * @param {import('../PluginBase.js').PluginContext} context
     * @returns {Promise<boolean>}
     */
    async init(context) {
        const grid = context.grid;
        this.#grid = grid;

        // Initialize attributes of agents created before this plugin started.
        for (const agent of grid.agents.getIterator()) {
            this.#initAgent(agent);
        }

        // Expose batteries to the sensing pipeline.
        grid.registerEntityLayer(this.#batteries);
        grid.agents.onChanged(this.#agentCreatedListener);
        grid.emitter.on('mapLoaded', this.#mapLoadedListener);

        // Action hooks: gates and costs around the invariant core actions
        actionHooks.beforeMove('energy', 10, (ctx) => this.#gateMove(ctx));
        actionHooks.afterMove('energy', 10, (ctx) => this.#spend(ctx.agent, config.GAME.energy.move_cost));
        actionHooks.pickup('energy', 10, (ctx) => this.#pickBattery(ctx));
        actionHooks.afterPickup('energy', 10, (ctx) => {
            if (Array.isArray(ctx.result) && ctx.result.length > 0) {
                this.#spend(ctx.agent, config.GAME.energy.pickup_cost);
            }
        });
        actionHooks.afterPutdown('energy', 10, (ctx) => {
            if (Array.isArray(ctx.result) && ctx.result.length > 0) {
                this.#spend(ctx.agent, config.GAME.energy.putdown_cost);
            }
        });

        // Spawn batteries on empty battery-spawner tiles, then self-schedule
        this.#spawnBatteries();
        this.#batteryTick = () => this.#spawnAndScheduleBatteries();
        this.#batteryEvent = /** @type {import('@unitn-asa/deliveroo-js-sdk/types/IOClockEvent.js').IOClockEvent} */ (config.GAME.energy.batteries_generation_event);
        myClock.once(this.#batteryEvent, this.#batteryTick);

        // Passive recharge, self-scheduled like the battery spawner
        this.#rechargeTick = () => this.#rechargeAndSchedule();
        this.#rechargeEvent = /** @type {import('@unitn-asa/deliveroo-js-sdk/types/IOClockEvent.js').IOClockEvent} */ (config.GAME.energy.recharge_event);
        myClock.once(this.#rechargeEvent, this.#rechargeTick);

        console.log('[EnergyPlugin] Energy started: energy resource, battery spawner and action costs active');
        return true;
    }

    /**
     * @param {import('../PluginBase.js').PluginContext} context
     * @returns {Promise<boolean>}
     */
    async shutdown(context) {
        const grid = context.grid;

        if (this.#batteryTick && this.#batteryEvent) {
            myClock.off(this.#batteryEvent, this.#batteryTick);
        }
        this.#batteryTick = null;
        this.#batteryEvent = null;

        if (this.#rechargeTick && this.#rechargeEvent) {
            myClock.off(this.#rechargeEvent, this.#rechargeTick);
        }
        this.#rechargeTick = null;
        this.#rechargeEvent = null;

        actionHooks.offBeforeMove('energy');
        actionHooks.offAfterMove('energy');
        actionHooks.offPickup('energy');
        actionHooks.offAfterPickup('energy');
        actionHooks.offAfterPutdown('energy');

        grid.agents.offChanged(this.#agentCreatedListener);
        grid.emitter.off('mapLoaded', this.#mapLoadedListener);

        this.#batteries.clear();
        grid.unregisterEntityLayer(this.#batteries.id);

        for (const agent of grid.agents.getIterator()) {
            agent.attributes.deleteByOwner('energy');
        }
        this.#grid = null;

        console.log('[EnergyPlugin] Energy stopped');
        return true;
    }

    /**
     * Veto hook: an exhausted agent cannot move (no penalty, no cost).
     * @param {import('../../core/actions/ActionHooks.js').MoveHookContext} ctx
     */
    #gateMove({ agent, dx, dy }) {
        const energy = config.GAME.energy;
        const value = agent.attributes.get('energy')?.value ?? energy.initial;
        if (value < energy.move_cost) {
            console.warn(`${agent.name}(${agent.id}) move to (${agent.x + dx},${agent.y + dy}) failed: out of energy`);
            return false;
        }
    }

    /**
     * Intercepting pickup handler: a battery restores the initial energy.
     * @param {import('../../core/actions/ActionHooks.js').PickupHookContext} ctx
     */
    #pickBattery({ agent, xy }) {
        const battery = xy && this.#batteries.getOneByXy(xy);
        if (!battery) return undefined;
        battery.delete();
        const initial = config.GAME.energy.initial;
        this.#setEnergy(agent, initial, initial);
        return { collected: 'battery' };
    }

    /**
     * Initialize the energy of an agent at the configured initial value.
     * @param {import('../../core/Agent.js').default} agent
     */
    #initAgent(agent) {
        const energy = config.GAME.energy;
        agent.attributes.set('energy', energy.initial, energy.initial, { owner: 'energy' });
    }

    /**
     * Set the energy of an agent and notify the self-sensing pipeline.
     * @param {import('../../core/Agent.js').default} agent
     * @param {number} value
     * @param {number} [max]
     */
    #setEnergy(agent, value, max) {
        const current = agent.attributes.get('energy');
        const next = {
            value,
            max: max ?? current?.max ?? config.GAME.energy.initial
        };
        agent.attributes.set('energy', next.value, next.max, { owner: 'energy' });
    }

    /**
     * Spend energy units, tolerating agents whose energy is unset.
     * @param {import('../../core/Agent.js').default} agent
     * @param {number} cost
     */
    #spend(agent, cost) {
        const energy = agent.attributes.get('energy');
        if (energy) this.#setEnergy(agent, energy.value - cost);
    }

    /**
     * Spawn a battery item on every empty battery-spawner tile.
     */
    #spawnBatteries() {
        if (!this.#grid) return;
        for (const tile of this.#grid.tiles.getIterator()) {
            if (!isBatterySpawner(tile)) continue;
            if (this.#batteries.getOneByXy(tile.xy)) continue;
            this.#batteries.create({ kind: 'battery', xy: tile.xy });
        }
    }

    /**
     * @returns {void}
     */
    #spawnAndScheduleBatteries() {
        this.#spawnBatteries();
        // Read the event at scheduling time so config changes take effect on the next spawn
        this.#batteryEvent = /** @type {import('@unitn-asa/deliveroo-js-sdk/types/IOClockEvent.js').IOClockEvent} */ (config.GAME.energy.batteries_generation_event);
        myClock.once(this.#batteryEvent, this.#batteryTick);
    }

    /**
     * @returns {void}
     */
    #rechargeAndSchedule() {
        const energy = config.GAME.energy;
        for (const agent of this.#grid?.agents.getIterator() ?? []) {
            const state = agent.attributes.get('energy');
            if (state) {
                this.#setEnergy(agent, Math.min(state.max, state.value + energy.recharge_amount));
            }
        }
        this.#rechargeEvent = /** @type {import('@unitn-asa/deliveroo-js-sdk/types/IOClockEvent.js').IOClockEvent} */ (config.GAME.energy.recharge_event);
        myClock.once(this.#rechargeEvent, this.#rechargeTick);
    }

}

export default EnergyPlugin;
