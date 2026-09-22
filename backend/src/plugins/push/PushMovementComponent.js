import MovementModeComponentBase from '../MovementModeComponentBase.js';
import { config } from '../../config/config.js';
import { DELTAS } from '../../core/movement/directions.js';
import * as worldRules from '../../core/movement/worldRules.js';

class PushMovementComponent extends MovementModeComponentBase {

    constructor() {
        super({ id: 'push-movement', mode: 'push' });
    }

    async move(agent, direction, grid) {
        const [dx, dy] = DELTAS[direction];

        const pushed = grid.agents.getOneByXy({ x: agent.x + dx, y: agent.y + dy });
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
        const tile = grid.tiles.getOneByXy({ x: agent.x + dx, y: agent.y + dy });
        return Boolean(tile && tile.walkable && !tile.locked);
    }
}

export default PushMovementComponent;
