import { config } from '../../../config/config.js';
import { DELTAS } from '../../../deliveroo/movement/directions.js';
import { applyMove } from '../../../deliveroo/movement/applyMove.js';
import * as worldRules from '../../../deliveroo/movement/worldRules.js';

class PushMovementComponent {
    id = 'push-movement';

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

        const pushed = grid.agentRegistry.getOneByXy({ x: agent.x + dx, y: agent.y + dy });
        if (pushed && pushed !== agent) {
            const pushOk = await worldRules.move(grid, pushed, dx, dy, { penalize: false });
            if (!pushOk) {
                agent.penalty -= config.PENALTY;
                return false;
            }
        }

        return await worldRules.move(grid, agent, dx, dy);
    }

    isMovePlausible(agent, direction, grid = agent.grid) {
        const [dx, dy] = DELTAS[direction];
        const tile = grid.tileRegistry.getOneByXy({ x: agent.x + dx, y: agent.y + dy });
        return Boolean(tile && tile.walkable && !tile.locked);
    }
}

export default PushMovementComponent;
