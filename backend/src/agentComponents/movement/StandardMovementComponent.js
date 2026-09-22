import { DELTAS, ROTATIONS, DIRECTIONS } from '../../core/movement/directions.js';
import { applyMove } from '../../core/movement/applyMove.js';
import * as worldRules from '../../core/movement/worldRules.js';
import { actionHooks } from '../../core/actions/ActionHooks.js';

const DESCRIPTIONS = {
    up: 'Move one tile up',
    down: 'Move one tile down',
    left: 'Move one tile left',
    right: 'Move one tile right'
};

class StandardMovementComponent {
    id = 'standard-movement';

    /** @type {(() => void) | null} */
    #offBusChanged = null;

    start(agent) {
        // One parameterless handler per directional command: the direction is
        // bound to the slot, the payload carries only the ack
        const handlers = new Map(DIRECTIONS.map((direction) => {
            const handler = ({ ack }) => void applyMove(agent, direction, this.move.bind(this), this.id, ack);
            handler.plausible = () => this.isMovePlausible(agent, direction);
            return [direction, handler];
        }));
        this.handlers = handlers;

        // Default directional provider: claims the commands upfront and
        // re-claims them whenever the bus reports the slots free, i.e. after
        // every mode component released them (attribute change or plugin
        // shutdown)
        const busListener = () => {
            for (const [direction, handler] of handlers) {
                if (!agent.commands.hasHandler(direction)) {
                    agent.commands.handle(direction, handler, this.id, { description: DESCRIPTIONS[direction] });
                }
            }
        };
        agent.commands.on('changed', busListener);
        this.#offBusChanged = () => agent.commands.off('changed', busListener);

        for (const [direction, handler] of handlers) {
            // The 'changed' listener above re-entrantly claims the remaining
            // slots during the first handle(): skip whatever is already taken
            if (!agent.commands.hasHandler(direction)) {
                agent.commands.handle(direction, handler, this.id, { description: DESCRIPTIONS[direction] });
            }
        }
    }

    stop(agent) {
        this.#offBusChanged?.();
        this.#offBusChanged = null;
        if (this.handlers) {
            for (const direction of this.handlers.keys()) {
                agent.commands.release(direction, this.id);
            }
        }
        this.handlers = null;
    }

    async move(agent, direction, grid) {
        const [dx, dy] = DELTAS[direction];
        const toTile = grid.tiles.getOneByXy({ x: agent.x + dx, y: agent.y + dy });
        const context = { agent, direction, dx, dy, toTile, grid };

        // Extension hooks may veto the move (energy, doors, ...)
        if (!(await actionHooks.runBeforeMove(context))) {
            return false;
        }

        const moved = await worldRules.move(grid, agent, dx, dy);
        if (moved !== false) {
            // Autorotate: the agent faces the direction it just moved
            agent.rotation = ROTATIONS[direction];
            await actionHooks.runAfterMove({ ...context, moved });
        }
        return moved;
    }

    isMovePlausible(agent, direction, grid = agent.grid) {
        const [dx, dy] = DELTAS[direction];
        const tile = grid.tiles.getOneByXy({ x: agent.x + dx, y: agent.y + dy });
        return Boolean(tile && tile.walkable && !tile.locked);
    }
}

export default StandardMovementComponent;
