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
        const target = { x: agent.x + dx, y: agent.y + dy };
        const pushed = grid.agents.getOneByXy(target);
        if (pushed && pushed !== agent) {
            // The lock on the target is the pushed agent's own, not an obstacle:
            // the move is feasible only if the pushed agent can move away too
            return worldRules.isMoveFeasible(grid, pushed, dx, dy)
                && worldRules.isMoveFeasible(grid, agent, dx, dy, { ignoreLockedAt: target });
        }
        return worldRules.isMoveFeasible(grid, agent, dx, dy);
    }
}

export default PushMovementComponent;
