import { config } from '../../config/config.js';
import myClock from '../../myClock.js';
import { DELTAS } from '../../core/movement/directions.js';
import { applyMove } from '../../core/movement/applyMove.js';
import * as worldRules from '../../core/movement/worldRules.js';

const FORWARD = { 0: 'up', 1: 'right', 2: 'down', 3: 'left' };

class RotationMovementComponent {
    id = 'rotation-movement';

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
            case 'down': {
                const [dx, dy] = DELTAS[FORWARD[rotation]];
                return await worldRules.move(grid, agent, -dx, -dy);
            }
            default:
                return false;
        }
    }

    isMovePlausible(agent, direction) {
        void agent;
        void direction;
        return true;
    }

    async #finishRotation(agent, newRotation) {
        await myClock.synch(config.GAME.player.movement_duration);
        agent.rotation = ((newRotation % 4) + 4) % 4;
        return agent.xy;
    }
}

export default RotationMovementComponent;
