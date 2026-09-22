import { config } from '../../config/config.js';
import myClock from '../../myClock.js';
import Xy from '../Xy.js';

const MOVEMENT_STEPS = 1;

/**
 * Faithful dry-run of the movement preconditions, shared by the real move and
 * by the command-bus plausibility checks: directional exit/entry, map
 * boundary, walkability, tile locks and crate chain. No side effects.
 * @param {import('../Grid.js').default} grid
 * @param {import('../Agent.js').default} agent
 * @param {number} incr_x
 * @param {number} incr_y
 * @param {{ignoreLockedAt?: {x: number, y: number} | null}} [options]
 * @returns {boolean}
 */
function isMoveFeasible(grid, agent, incr_x, incr_y, { ignoreLockedAt = null } = {}) {
    const fromTile = agent.tile;
    if (!fromTile) {
        return false;
    }

    if (fromTile.isDirectional && !fromTile.allowsExitInDirection(incr_x, incr_y)) {
        return false;
    }

    const toTile = grid.tiles.getOneByXy({ x: agent.x + incr_x, y: agent.y + incr_y });

    if (toTile && toTile.isDirectional && !toTile.allowsMovementFrom(agent.x, agent.y)) {
        return false;
    }

    if (!toTile) {
        return false;
    }
    if (!toTile.walkable) {
        return false;
    }
    if (toTile.locked) {
        // A lock is only skipped where it is displaced out of the way by the
        // move itself, e.g. the pushed agent's own lock on the push target
        const skip = ignoreLockedAt && toTile.x === ignoreLockedAt.x && toTile.y === ignoreLockedAt.y;
        if (!skip) {
            return false;
        }
    }

    const crate = grid.crates.getOneByXy({ x: agent.x + incr_x, y: agent.y + incr_y });
    if (crate) {
        const crateDestTile = grid.tiles.getOneByXy({ x: crate.x + incr_x, y: crate.y + incr_y });

        if (!crateDestTile || !crateDestTile.type.startsWith('5') || crateDestTile.locked) {
            return false;
        }

        const crateAtDest = grid.crates.getOneByXy(new Xy({ x: crate.x + incr_x, y: crate.y + incr_y }));
        if (crateAtDest) {
            return false;
        }
    }

    return true;
}

/**
 * Move an agent by the given increments through the invariant world rules:
 * directional tiles, walkability, locks, crates, penalties and animation.
 * @param {import('../Grid.js').default} grid
 * @param {import('../Agent.js').default} agent
 * @param {number} incr_x
 * @param {number} incr_y
 * @param {{penalize?: boolean, ignoreLockedAt?: {x: number, y: number} | null}} [options]
 * @returns {Promise<Xy|boolean>}
 */
async function move(grid, agent, incr_x, incr_y, { penalize = true, ignoreLockedAt = null } = {}) {
    const fromTile = agent.tile;
    if (!fromTile) {
        return false;
    }

    if (!isMoveFeasible(grid, agent, incr_x, incr_y, { ignoreLockedAt })) {
        // Failed moves are routine contention (another agent standing there,
        // walls, directional restrictions): they only apply the penalty and
        // return false, no logging, otherwise busy NPCs would flood the output
        if (penalize) {
            agent.penalty -= config.PENALTY;
        }
        return false;
    }

    const toTile = grid.tiles.getOneByXy({ x: agent.x + incr_x, y: agent.y + incr_y });
    const crate = grid.crates.getOneByXy({ x: agent.x + incr_x, y: agent.y + incr_y });
    if (crate) {
        const crateDestTile = grid.tiles.getOneByXy({ x: crate.x + incr_x, y: crate.y + incr_y });
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

export { move, stepByStep, isMoveFeasible };
