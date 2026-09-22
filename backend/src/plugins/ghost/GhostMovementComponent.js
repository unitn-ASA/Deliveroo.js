import MovementModeComponentBase from '../MovementModeComponentBase.js';
import { DELTAS } from '../../core/movement/directions.js';
import { stepByStep } from '../../core/movement/worldRules.js';

class GhostMovementComponent extends MovementModeComponentBase {

    constructor() {
        super({ id: 'ghost-movement', mode: 'ghost' });
    }

    async move(agent, direction, grid) {
        const fromTile = agent.tile;
        if (!fromTile) return false;

        const [dx, dy] = DELTAS[direction];
        const toTile = grid.tiles.getOneByXy({ x: agent.x + dx, y: agent.y + dy });
        if (!toTile) return false;

        fromTile.unlock();
        await stepByStep(agent, fromTile, toTile);
        return agent.xy;
    }

    isMovePlausible(agent, direction, grid = agent.grid) {
        const [dx, dy] = DELTAS[direction];
        return Boolean(grid.tiles.getOneByXy({ x: agent.x + dx, y: agent.y + dy }));
    }
}

export default GhostMovementComponent;
