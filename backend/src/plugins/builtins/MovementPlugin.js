import PluginBase from '../PluginBase.js';
import { config } from '../../config/config.js';

/**
 * Standard movement plugin: cardinal directions.
 * Owns the 'move' command while running: translates the direction into the
 * corresponding agent controller call (action mutex, penalties and movement
 * animation are handled by the controller).
 */
class MovementPlugin extends PluginBase {

    /** @type {(command: import('../../ioServer/commands/commandBus.js').MoveCommand) => void} */
    #handler = null;

    constructor() {
        super({
            id: 'movement-standard',
            name: 'Standard Movement',
            version: '1.0.0',
            description: 'Standard cardinal movement (up, down, left, right)'
        });
    }

    /**
     * @param {import('../PluginBase.js').PluginContext} context
     * @returns {Promise<boolean>}
     */
    async init(context) {
        this.#handler = (command) => this.#onMove(command);
        context.commands.handle('move', this.#handler, this.id);
        console.log('[MovementPlugin] Handling move commands');
        return true;
    }

    /**
     * @param {import('../../ioServer/commands/commandBus.js').MoveCommand} command
     */
    async #onMove({ agent, direction, ack }) {
        try {
            // Direction is already validated by handleActions
            const moving = await agent.controller[direction]();
            if (ack) ack(moving);
        } catch (error) {
            console.error(`[MovementPlugin] Move error for ${agent.name}(${agent.id}):`, error.message);
            agent.penalty -= config.PENALTY;
            if (ack) ack(false);
        }
    }

    /**
     * @param {import('../PluginBase.js').PluginContext} context
     * @returns {Promise<boolean>}
     */
    async shutdown(context) {
        context.commands.release('move', this.id);
        return true;
    }

}

export default MovementPlugin;
