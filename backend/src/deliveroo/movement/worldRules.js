import { config } from '../../config/config.js';
import myClock from '../../myClock.js';
import Xy from '../Xy.js';

const MOVEMENT_STEPS = 1;

/**
 * Move an agent by the given increments through the invariant world rules:
 * directional tiles, walkability, locks, crates, penalties and animation.
 * @param {import('../Grid.js').default} grid
 * @param {import('../Agent.js').default} agent
 * @param {number} incr_x
 * @param {number} incr_y
 * @param {{penalize?: boolean}} [options]
 * @returns {Promise<Xy|boolean>}
 */
async function move(grid, agent, incr_x, incr_y, { penalize = true } = {}) {
    const fromTile = agent.tile;
    if (!fromTile) {
        return false;
    }

    const fail = (reason = 'blocked') => {
        console.warn(`${agent.name}(${agent.id}) move to (${agent.x + incr_x},${agent.y + incr_y}) failed: ${reason}`);
        if (penalize) {
            agent.penalty -= config.PENALTY;
        }
        return false;
    };

    const toTile = grid.tileRegistry.getOneByXy({ x: agent.x + incr_x, y: agent.y + incr_y });

    if (fromTile.isDirectional && !fromTile.allowsExitInDirection(incr_x, incr_y)) {
        return fail('directional exit restriction');
    }

    if (toTile && toTile.isDirectional && !toTile.allowsMovementFrom(agent.x, agent.y)) {
        return fail('directional entry restriction');
    }

    if (!toTile) {
        return fail('no tile (map boundary)');
    }
    if (!toTile.walkable) {
        return fail('tile not walkable');
    }
    if (toTile.locked) {
        return fail('tile locked (another agent standing or moving there)');
    }

    const crate = grid.crateRegistry.getOneByXy({ x: agent.x + incr_x, y: agent.y + incr_y });
    if (crate) {
        const crateDestTile = grid.tileRegistry.getOneByXy({ x: crate.x + incr_x, y: crate.y + incr_y });

        if (!crateDestTile || !crateDestTile.type.startsWith('5') || crateDestTile.locked) {
            return fail();
        }

        const crateAtDest = grid.crateRegistry.getOneByXy(new Xy({ x: crate.x + incr_x, y: crate.y + incr_y }));
        if (crateAtDest) {
            return fail();
        }

        crate.xy = new Xy(crateDestTile.x, crateDestTile.y);
    }

    await stepByStep(agent, fromTile, toTile);

    return agent.xy;
}

/**
 * Execute step-by-step animated movement.
 * @param {import('../Agent.js').default} agent
 * @param {import('../Tile.js').default} fromTile
 * @param {import('../Tile.js').default} toTile
 */
async function stepByStep(agent, fromTile, toTile) {
    const incr_x = toTile.x - fromTile.x;
    const incr_y = toTile.y - fromTile.y;

    toTile.lock();

    const init_x = agent.x;
    const init_y = agent.y;

    if (MOVEMENT_STEPS) {
        agent.xy = new Xy({
            x: (100 * agent.x + 100 * incr_x / MOVEMENT_STEPS * 12 / 20) / 100,
            y: (100 * agent.y + 100 * incr_y / MOVEMENT_STEPS * 12 / 20) / 100
        });
    }

    for (let i = 0; i < MOVEMENT_STEPS; i++) {
        await myClock.synch(config.GAME.player.movement_duration / MOVEMENT_STEPS);
        if (i < MOVEMENT_STEPS - 1) {
            agent.xy = new Xy({
                x: (100 * agent.x + 100 * incr_x / MOVEMENT_STEPS) / 100,
                y: (100 * agent.y + 100 * incr_y / MOVEMENT_STEPS) / 100
            });
        }
    }

    agent.xy = new Xy({
        x: init_x + incr_x,
        y: init_y + incr_y
    });

    fromTile.unlock();
}

export { move, stepByStep };
