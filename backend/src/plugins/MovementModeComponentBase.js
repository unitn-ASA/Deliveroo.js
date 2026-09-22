import { applyMove } from '../core/movement/applyMove.js';
import { DIRECTIONS } from '../core/movement/directions.js';

/**
 * Attribute-driven movement mode component.
 *
 * Listens to the agent's observable attributes and claims the four explicit
 * directional commands ('up', 'down', 'left', 'right') while the
 * 'movement_mode' attribute selects this mode. Any other value (or its
 * removal) releases them: the standard movement, which self-heals freed
 * slots through the bus 'changed' event, takes over again.
 *
 * Synchronizations are serialized per component instance and the claim
 * happens once the current action is idle, with the attribute re-validated
 * after the wait so rapid changes cannot install a stale mode.
 */
class MovementModeComponentBase {

    /** @type {string} command owner id, e.g. 'ghost-movement' */
    id;

    /** @type {string} 'movement_mode' attribute value this component serves */
    mode;

    /** @type {(() => void) | null} */
    #offAttributes = null;

    /** @type {Promise<void> | null} serialized sync chain */
    #pending = null;

    /** @type {Map<string, Function> | null} directional command handlers, while attached */
    #handlers = null;

    /**
     * @param {{id: string, mode: string}} options
     */
    constructor({ id, mode }) {
        this.id = id;
        this.mode = mode;
    }

    /**
     * @param {import('../core/Agent.js').default} agent
     */
    start(agent) {
        // One parameterless handler per directional command: the direction is
        // bound to the slot, the payload carries only the ack
        this.#handlers = new Map(DIRECTIONS.map((direction) => {
            const handler = ({ ack }) => void applyMove(agent, direction, this.move.bind(this), this.id, ack);
            handler.plausible = () => this.isMovePlausible(agent, direction);
            return [direction, handler];
        }));

        const listener = () => void this.#sync(agent);
        agent.emitter.on('attributes', listener);
        this.#offAttributes = () => agent.emitter.off('attributes', listener);
        // The attribute may already select this mode
        void this.#sync(agent);
    }

    /**
     * @param {import('../core/Agent.js').default} agent
     */
    stop(agent) {
        this.#offAttributes?.();
        this.#offAttributes = null;
        if (this.#handlers) {
            for (const direction of this.#handlers.keys()) {
                agent.commands.release(direction, this.id);
            }
        }
        this.#handlers = null;
    }

    /**
     * The movement behavior of the mode. Subclasses override.
     * @param {import('../core/Agent.js').default} agent
     * @param {'up'|'down'|'left'|'right'} direction
     * @param {import('../core/Grid.js').default} grid
     * @returns {Promise<any>}
     */
    async move(agent, direction, grid) {
        void agent; void direction; void grid;
        return false;
    }

    /**
     * Cheap plausibility check exposed through the command handler.
     * Subclasses override.
     * @param {import('../core/Agent.js').default} agent
     * @param {'up'|'down'|'left'|'right'} direction
     * @param {import('../core/Grid.js').default} [grid]
     * @returns {boolean}
     */
    isMovePlausible(agent, direction, grid) {
        void agent; void direction; void grid;
        return false;
    }

    /**
     * @param {import('../core/Agent.js').default} agent
     */
    #sync(agent) {
        const chained = (this.#pending ?? Promise.resolve())
            .catch(() => {})
            .then(() => this.#apply(agent));
        this.#pending = chained;
        return chained.finally(() => {
            if (this.#pending === chained) this.#pending = null;
        });
    }

    /**
     * @param {import('../core/Agent.js').default} agent
     */
    async #apply(agent) {
        // Skip agents removed while queued
        if (agent.grid?.agents?.get(agent.id) !== agent) return;

        await agent.actionMutex.waitIdle();
        // Re-validate after the wait: a rapid change must not install a stale mode
        if (agent.attributes.get('movement_mode')?.value !== this.mode) {
            for (const direction of this.#handlers?.keys() ?? []) {
                agent.commands.release(direction, this.id);
            }
            return;
        }
        for (const [direction, handler] of this.#handlers) {
            agent.commands.claim(direction, this.id, handler);
        }
    }

}

export default MovementModeComponentBase;
