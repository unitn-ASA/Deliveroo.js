import PluginBase from '../PluginBase.js';
import { config } from '../../config/config.js';
import myClock from '../../myClock.js';

/** Maps a rotation value to the controller method moving one tile in that direction. */
const FORWARD = { 0: 'up', 1: 'right', 2: 'down', 3: 'left' };
/** Maps a direction to its opposite. */
const OPPOSITE = { up: 'down', down: 'up', left: 'right', right: 'left' };

/**
 * Alternative movement scheme with tank-like controls:
 * - 'left' / 'right' rotate the agent on the spot, taking the same time as a move
 * - 'up' moves one tile forward in the facing direction
 * - 'down' moves one tile backward
 * Rotation is tracked per agent: 0=North, 1=East, 2=South, 3=West (default North).
 *
 * All actual movement goes through the agent controller, so the action mutex,
 * penalties and movement animation apply exactly as in the standard scheme.
 * Rotations run through the same action mutex and consume movement_duration,
 * so they serialize with moves and cannot be spammed.
 */
class RotationMovementPlugin extends PluginBase {

    /** @type {(command: import('../../ioServer/commands/commandBus.js').MoveCommand) => void} */
    #handler = null;

    /** @type {Map<string, number>} agentId -> rotation (0=N, 1=E, 2=S, 3=W) */
    #rotations = new Map();

    constructor() {
        super({
            id: 'movement-rotation',
            name: 'Rotation Movement',
            version: '1.0.0',
            description: 'Tank-like controls: left/right rotate, up/down move forward/backward'
        });
    }

    /**
     * @param {import('../PluginBase.js').PluginContext} context
     * @returns {Promise<boolean>}
     */
    async init(context) {
        this.#handler = (command) => this.#onMove(command);
        context.commands.handle('move', this.#handler, this.id);
        console.log('[RotationMovementPlugin] Handling move commands (tank controls)');
        return true;
    }

    /**
     * @param {import('../../ioServer/commands/commandBus.js').MoveCommand} command
     */
    async #onMove({ agent, direction, ack }) {
        try {
            const rotation = this.#rotations.get(agent.id) ?? 0;
            let result = false;

            switch (direction) {
                case 'left':
                    result = await this.#rotate(agent, rotation + 3); // rotate counter-clockwise
                    break;
                case 'right':
                    result = await this.#rotate(agent, rotation + 1); // rotate clockwise
                    break;
                case 'up':
                    result = await agent.controller[FORWARD[rotation]]();
                    break;
                case 'down':
                    result = await agent.controller[OPPOSITE[FORWARD[rotation]]]();
                    break;
            }

            if (ack) ack(result);
        } catch (error) {
            console.error(`[RotationMovementPlugin] Move error for ${agent.name}(${agent.id}):`, error.message);
            agent.penalty -= config.PENALTY;
            if (ack) ack(false);
        }
    }

    /**
     * Rotate the agent by delta quarter-turns, taking the same time as a move.
     * Runs through the action mutex so rotations serialize with other actions,
     * and conflicts are penalized like any other concurrent action.
     * @param {import('../../deliveroo/Agent.js').default} agent
     * @param {number} newRotation - Target rotation (0-3, possibly pre-wrap)
     * @returns {Promise<any>} agent.xy on success, false on mutex conflict
     */
    async #rotate(agent, newRotation) {
        return await agent.actionMutex.execute(async () => {
            await myClock.synch(config.GAME.player.movement_duration);
            this.#rotations.set(agent.id, ((newRotation % 4) + 4) % 4);
            return agent.xy;
        });
    }

    /**
     * @param {import('../PluginBase.js').PluginContext} context
     * @returns {Promise<boolean>}
     */
    async shutdown(context) {
        context.commands.release('move', this.id);
        this.#rotations.clear();
        return true;
    }

}

export default RotationMovementPlugin;
