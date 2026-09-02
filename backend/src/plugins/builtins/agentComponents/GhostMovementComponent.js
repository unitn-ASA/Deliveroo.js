import { DELTAS } from '../../../deliveroo/movement/directions.js';
import { applyMove } from '../../../deliveroo/movement/applyMove.js';
import { stepByStep } from '../../../deliveroo/movement/worldRules.js';

class GhostMovementComponent {
    id = 'ghost-movement';

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
        const fromTile = agent.tile;
        if (!fromTile) return false;

        const [dx, dy] = DELTAS[direction];
        const toTile = grid.tileRegistry.getOneByXy({ x: agent.x + dx, y: agent.y + dy });
        if (!toTile) return false;

        fromTile.unlock();
        await stepByStep(agent, fromTile, toTile);
        return agent.xy;
    }

    isMovePlausible(agent, direction, grid = agent.grid) {
        const [dx, dy] = DELTAS[direction];
        return Boolean(grid.tileRegistry.getOneByXy({ x: agent.x + dx, y: agent.y + dy }));
    }
}

export default GhostMovementComponent;
