import MovementModeComponentBase from '../MovementModeComponentBase.js';
import { config } from '../../config/config.js';
import myClock from '../../myClock.js';
import { DELTAS, FORWARD } from '../../core/movement/directions.js';
import * as worldRules from '../../core/movement/worldRules.js';

class RotationMovementComponent extends MovementModeComponentBase {

    constructor() {
        super({ id: 'rotation-movement', mode: 'rotation' });
    }

    async move(agent, direction, grid) {
        const rotation = agent.rotation ?? 0;

        switch (direction) {
            case 'left':
                return await this.#finishRotation(agent, rotation + 3);
            case 'right':
                return await this.#finishRotation(agent, rotation + 1);
            case 'up': {
                const [dx, dy] = DELTAS[FORWARD[rotation]];
                return await worldRules.move(grid, agent, dx, dy);
            }
            default:
                // 'down' (backward) is not a command in this mode: the agent
                // must turn around with 'left'/'right' to face the other way
                return false;
        }
    }

    isMovePlausible(agent, direction, grid = agent.grid) {
        if (direction === 'down') {
            // 'down' (backward) is not a command in this mode: the agent
            // must turn around with 'left'/'right' to face the other way
            return false;
        }
        if (direction !== 'up') {
            // turning in place is always feasible
            return true;
        }
        // moving forward follows the standard world rules on the facing tile
        const rotation = agent.rotation ?? 0;
        const [dx, dy] = DELTAS[FORWARD[rotation]];
        return worldRules.isMoveFeasible(grid, agent, dx, dy);
    }

    async #finishRotation(agent, newRotation) {
        await myClock.synch(config.GAME.player.movement_duration);
        agent.rotation = ((newRotation % 4) + 4) % 4;
        return agent.xy;
    }
}

export default RotationMovementComponent;
