import PluginBase from '../PluginBase.js';
import EntityLayer from '../../core/EntityLayer.js';
import Xy from '../../core/Xy.js';
import { config } from '../../config/config.js';
import { DELTAS, FORWARD } from '../../core/movement/directions.js';

/**
 * Plugin-provided action: registers a 'shoot' command on every agent's
 * command bus. Clients discover it through the REST API
 * (GET /api/agents/:id/commands) and invoke it through the generic
 * 'action' event. The command takes no parameters: the laser fires along
 * the agent's own facing, which the standard movement autorotates to the
 * movement direction and rotation-based components turn explicitly.
 *
 * The beam covers the walkable tiles from the adjacent one up to the first
 * agent in the line (inclusive) or to the last tile before a wall, and
 * lasts GAME.player.movement_duration. Each laser tile is a plugin-owned
 * 'laser' entity (direction-carrying, rendered by the webapp); the first
 * agent on the beam loses one point.
 */
class ShooterPlugin extends PluginBase {

    /** @type {Set<import('../../core/Agent.js').default>} */
    #agents = new Set();

    /** @type {((event: any) => void) | null} */
    #agentsListener = null;

    /** @type {import('../../core/Grid.js').default | null} */
    #grid = null;

    /** @type {EntityLayer} plugin-owned laser entities */
    #lasers = new EntityLayer({
        id: 'shooter:lasers'
    });

    /** @type {Set<ReturnType<typeof setTimeout>>} */
    #timers = new Set();

    constructor() {
        super({
            id: 'shooter',
            name: 'Shooter',
            version: '1.0.0',
            description: 'Registers a laser shoot action on every agent command bus: fires along the agent\'s facing; the first agent in line loses one point'
        });
    }

    /**
     * @param {import('../PluginBase.js').PluginContext} context
     * @returns {Promise<boolean>}
     */
    async init(context) {
        this.#grid = context.grid;
        context.grid.registerEntityLayer(this.#lasers);

        this.#agentsListener = ({ object, type }) => {
            if (type === 'removed') {
                if (object) this.#agents.delete(object);
                return;
            }
            if (object) this.#register(object);
        };
        context.grid.agents.onChanged(this.#agentsListener);
        for (const agent of Array.from(context.grid.agents.getIterator())) {
            this.#register(agent);
        }
        console.log('[shooter] laser shoot action registered');
        return true;
    }

    /**
     * @param {import('../PluginBase.js').PluginContext} context
     * @returns {Promise<boolean>}
     */
    async shutdown(context) {
        if (this.#agentsListener) {
            context.grid.agents.offChanged(this.#agentsListener);
            this.#agentsListener = null;
        }
        for (const agent of this.#agents) {
            agent.commands.release('shoot', this.id);
        }
        this.#agents.clear();

        // Remove pending beams and their deletion timers
        for (const timer of this.#timers) {
            clearTimeout(timer);
        }
        this.#timers.clear();
        for (const laser of Array.from(this.#lasers.getIterator())) {
            laser.delete();
        }
        context.grid.unregisterEntityLayer(this.#lasers.id);
        this.#grid = null;
        return true;
    }

    /**
     * @param {import('../../core/Agent.js').default} agent
     */
    #register(agent) {
        if (this.#agents.has(agent)) return;
        if (agent.commands.hasHandler('shoot')) return;
        agent.commands.handle('shoot', ({ ack }) => {
            const result = this.#shoot(agent);
            ack?.(result);
        }, this.id, { description: 'Fire the laser in the agent facing direction' });
        this.#agents.add(agent);
    }

    /**
     * Fire the laser along the agent's own facing: compute the beam,
     * materialize it as entities and charge the first agent in line one point.
     * @param {import('../../core/Agent.js').default} agent
     */
    #shoot(agent) {
        const from = { x: agent.x, y: agent.y };
        // The agent's own facing is the shot direction
        const direction = FORWARD[agent.rotation ?? 0];

        // Walk the line: walkable tiles until the first agent (inclusive)
        // or the last tile before a wall
        const [dx, dy] = DELTAS[direction];
        const beam = [];
        let hit = null;
        let x = from.x;
        let y = from.y;
        while (this.#grid) {
            x += dx;
            y += dy;
            const tile = this.#grid.tiles.getOneByXy({ x, y });
            if (!tile || !tile.walkable) break;
            beam.push({ x, y });
            const victim = this.#grid.agents.getOneByXy({ x, y });
            if (victim) {
                hit = victim;
                break;
            }
        }

        // Materialize the beam as direction-carrying entities
        const duration = Number(config.GAME.player?.movement_duration) || 500;
        const lasers = beam.map(({ x, y }) => this.#lasers.create({
            kind: 'laser',
            xy: new Xy(x, y),
            attributes: [{ kind: 'direction', value: direction }]
        }));
        if (lasers.length > 0) {
            const timer = setTimeout(() => {
                for (const laser of lasers) {
                    laser.delete();
                }
                this.#timers.delete(timer);
            }, duration);
            this.#timers.add(timer);
        }

        // The first agent in line loses one point
        if (hit) {
            hit.score -= 1;
        }

        const result = {
            shot: true,
            from,
            direction,
            hit: hit ? { id: hit.id, name: hit.name } : null,
            length: beam.length
        };
        console.log(`[shooter] ${agent.name}(${agent.id}) shoots ${JSON.stringify(result)}`);
        return result;
    }

}

export default ShooterPlugin;
