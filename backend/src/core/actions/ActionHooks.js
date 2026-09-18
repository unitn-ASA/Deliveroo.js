/**
 * Global action hook pipeline.
 *
 * Plugins register hooks around the invariant core actions; the standard
 * agent components run them while keeping a single command handler per
 * action. Hooks compose instead of replacing:
 *
 * - beforeMove: may veto a move by returning false (no penalty, no cost)
 * - afterMove: runs after a successful move (spend costs, consume items)
 * - pickup: intercepting handlers, ordered by priority; the first handler
 *   returning a non-undefined result handles the pickup, otherwise the core
 *   parcel pickup applies
 * - putdown: intercepting handlers, same semantics as pickup
 * - afterPickup: runs after the core parcel pickup
 * - afterPutdown: runs after any putdown path (intercepted or core)
 *
 * Hooks are identified by their owner id (usually the plugin id); a plugin
 * re-registering the same id replaces its hook.
 */

/**
 * @typedef {Object} MoveHookContext
 * @property {import('../Agent.js').default} agent
 * @property {'up'|'down'|'left'|'right'} direction
 * @property {number} dx
 * @property {number} dy
 * @property {import('../Tile.js').default | undefined} toTile - Target tile before the move
 * @property {import('../Grid.js').default} grid
 * @property {any} [moved] - Movement result (afterMove only)
 */

/**
 * @typedef {Object} PickupHookContext
 * @property {import('../Agent.js').default} agent
 * @property {import('../Grid.js').default} grid
 * @property {any} xy - Rounded agent position
 */

/**
 * @typedef {Object} PutdownHookContext
 * @property {import('../Agent.js').default} agent
 * @property {import('../Grid.js').default} grid
 * @property {string[]} selected
 */

class ActionHooks {

    /** @type {Map<string, {priority: number, seq: number, fn: Function}>} */
    #beforeMove = new Map();
    /** @type {Map<string, {priority: number, seq: number, fn: Function}>} */
    #afterMove = new Map();
    /** @type {Map<string, {priority: number, seq: number, fn: Function}>} */
    #pickup = new Map();
    /** @type {Map<string, {priority: number, seq: number, fn: Function}>} */
    #putdown = new Map();
    /** @type {Map<string, {priority: number, seq: number, fn: Function}>} */
    #afterPickup = new Map();
    /** @type {Map<string, {priority: number, seq: number, fn: Function}>} */
    #afterPutdown = new Map();

    /** @type {number} registration sequence, to keep stable ordering within a priority */
    #seq = 0;

    /**
     * @param {Map<string, {priority: number, seq: number, fn: Function}>} registry
     * @param {string} id
     * @param {number} priority
     * @param {Function} fn
     */
    #set(registry, id, priority, fn) {
        if (typeof fn !== 'function') {
            throw new Error(`ActionHooks: hook '${id}' must be a function`);
        }
        registry.set(id, { priority, seq: this.#seq++, fn });
    }

    /**
     * @param {Map<string, {priority: number, seq: number, fn: Function}>} registry
     * @returns {Function[]}
     */
    #sorted(registry) {
        return Array.from(registry.values())
            .sort((a, b) => (a.priority - b.priority) || (a.seq - b.seq))
            .map((entry) => entry.fn);
    }

    /**
     * Register a veto hook run before the core movement rule.
     * @param {string} id - Owner id (usually the plugin id)
     * @param {number} priority - Lower runs first
     * @param {(context: MoveHookContext) => boolean | void | Promise<boolean | void>} fn - Return false to veto
     */
    beforeMove(id, priority, fn) { this.#set(this.#beforeMove, id, priority, fn); }

    /**
     * @param {string} id
     */
    offBeforeMove(id) { this.#beforeMove.delete(id); }

    /**
     * @param {MoveHookContext} context
     * @returns {Promise<boolean>} false when any hook vetoed the move
     */
    async runBeforeMove(context) {
        for (const fn of this.#sorted(this.#beforeMove)) {
            if (await fn(context) === false) {
                return false;
            }
        }
        return true;
    }

    /**
     * Register a hook run after a successful move.
     * @param {string} id
     * @param {number} priority
     * @param {(context: MoveHookContext) => any} fn
     */
    afterMove(id, priority, fn) { this.#set(this.#afterMove, id, priority, fn); }

    /**
     * @param {string} id
     */
    offAfterMove(id) { this.#afterMove.delete(id); }

    /**
     * @param {MoveHookContext} context
     */
    async runAfterMove(context) {
        for (const fn of this.#sorted(this.#afterMove)) {
            await fn(context);
        }
    }

    /**
     * Register an intercepting pickup handler. The first handler returning a
     * non-undefined value handles the pickup; otherwise the core parcel
     * pickup applies.
     * @param {string} id
     * @param {number} priority - Lower runs first
     * @param {(context: PickupHookContext) => any} fn - Return undefined to pass
     */
    pickup(id, priority, fn) { this.#set(this.#pickup, id, priority, fn); }

    /**
     * @param {string} id
     */
    offPickup(id) { this.#pickup.delete(id); }

    /**
     * @param {PickupHookContext} context
     * @returns {Promise<any | undefined>}
     */
    async runPickup(context) {
        for (const fn of this.#sorted(this.#pickup)) {
            const result = await fn(context);
            if (result !== undefined) {
                return result;
            }
        }
        return undefined;
    }

    /**
     * Register an intercepting putdown handler. The first handler returning a
     * non-undefined value handles the putdown; otherwise the core parcel
     * putdown applies.
     * @param {string} id
     * @param {number} priority - Lower runs first
     * @param {(context: PutdownHookContext) => any} fn - Return undefined to pass
     */
    putdown(id, priority, fn) { this.#set(this.#putdown, id, priority, fn); }

    /**
     * @param {string} id
     */
    offPutdown(id) { this.#putdown.delete(id); }

    /**
     * @param {PutdownHookContext} context
     * @returns {Promise<any | undefined>}
     */
    async runPutdown(context) {
        for (const fn of this.#sorted(this.#putdown)) {
            const result = await fn(context);
            if (result !== undefined) {
                return result;
            }
        }
        return undefined;
    }

    /**
     * Register a hook run after the core parcel pickup.
     * @param {string} id
     * @param {number} priority
     * @param {(context: PickupHookContext & {result: any}) => any} fn
     */
    afterPickup(id, priority, fn) { this.#set(this.#afterPickup, id, priority, fn); }

    /**
     * @param {string} id
     */
    offAfterPickup(id) { this.#afterPickup.delete(id); }

    /**
     * @param {PickupHookContext & {result: any}} context
     */
    async runAfterPickup(context) {
        for (const fn of this.#sorted(this.#afterPickup)) {
            await fn(context);
        }
    }

    /**
     * Register a hook run after any putdown path (intercepted or core).
     * @param {string} id
     * @param {number} priority
     * @param {(context: PutdownHookContext & {result: any}) => any} fn
     */
    afterPutdown(id, priority, fn) { this.#set(this.#afterPutdown, id, priority, fn); }

    /**
     * @param {string} id
     */
    offAfterPutdown(id) { this.#afterPutdown.delete(id); }

    /**
     * @param {PutdownHookContext & {result: any}} context
     */
    async runAfterPutdown(context) {
        for (const fn of this.#sorted(this.#afterPutdown)) {
            await fn(context);
        }
    }

}

/**
 * Shared singleton so the standard agent components and provider plugins
 * resolve the same pipeline without import cycles.
 * @type {ActionHooks}
 */
const actionHooks = new ActionHooks();

export { actionHooks, ActionHooks };
