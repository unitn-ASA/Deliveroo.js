import { DELTAS } from '../../core/movement/directions.js';
import { applyMove } from '../../core/movement/applyMove.js';
import * as worldRules from '../../core/movement/worldRules.js';

class StandardMovementComponent {
    id = 'standard-movement';

    start(agent) {
        const handler = ({ direction, ack }) => void applyMove(agent, direction, this.move.bind(this), this.id, ack);
        handler.plausible = ({ direction }) => this.isMovePlausible(agent, direction);
        this.handler = handler;
        agent.commands.handle('move', handler, this.id);
    }

    stop(agent) {
        agent.commands.release('move', this.id);
    }

    async move(agent, direction, grid) {
        const [dx, dy] = DELTAS[direction];
        return await worldRules.move(grid, agent, dx, dy);
    }

    isMovePlausible(agent, direction, grid = agent.grid) {
        const [dx, dy] = DELTAS[direction];
        const tile = grid.tileRegistry.getOneByXy({ x: agent.x + dx, y: agent.y + dy });
        return Boolean(tile && tile.walkable && !tile.locked);
    }
}

export default StandardMovementComponent;
