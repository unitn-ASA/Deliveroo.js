import { config } from '../config/config.js';

/**
 * Pick up all free parcels on the agent tile.
 * @param {import('./Grid.js').default} grid
 * @param {import('./Agent.js').default} agent
 * @returns {import('./Parcel.js').default[]}
 */
function pickUp(grid, agent) {
    const picked = [];
    for (const parcel of grid.parcelRegistry.getByXy(agent?.xy?.rounded)) {
        if (parcel.carriedBy == null) {
            agent.carryingParcels.add(parcel);
            parcel.carriedBy = agent;
            picked.push(parcel);
        }
    }
    return picked;
}

/**
 * Put down selected carried parcels, or all carried parcels when ids is empty.
 * Delivery scoring is an invariant parcel world rule.
 * @param {import('./Grid.js').default} grid
 * @param {import('./Agent.js').default} agent
 * @param {string[]} [ids]
 * @returns {import('./Parcel.js').default[]}
 */
function putDown(grid, agent, ids = []) {
    const tile = agent.tile;
    let scoreAdded = 0;
    const dropped = [];
    let toPutDown = Array.from(agent.carryingParcels.values());

    if (ids && ids.length > 0) {
        toPutDown = toPutDown.filter((parcel) => ids.includes(parcel.id));
    }

    for (const parcel of toPutDown) {
        agent.carryingParcels.delete(parcel);
        parcel.carriedBy = null;
        dropped.push(parcel);

        if (tile?.delivery) {
            scoreAdded += parcel.reward;
            parcel.delete();
        }
    }

    agent.score += scoreAdded;
    return dropped;
}

/**
 * Execute pickup under the agent action mutex and acknowledge exactly once.
 * @param {import('./Agent.js').default} agent
 * @param {(picked: any[]) => void} [ack]
 * @returns {Promise<import('./Parcel.js').default[]>}
 */
async function applyPickup(agent, ack) {
    let result;
    try {
        result = await agent.actionMutex.execute(() => pickUp(agent.grid, agent)) || [];
    } catch (error) {
        console.error(`[parcel] Pickup error for ${agent.name}(${agent.id}):`, error.message);
        agent.penalty -= config.PENALTY;
        result = [];
    }
    if (ack) ack(result);
    return result;
}

/**
 * Execute putdown under the agent action mutex and acknowledge exactly once.
 * @param {import('./Agent.js').default} agent
 * @param {string[]} [ids]
 * @param {(dropped: {id: string}[]) => void} [ack]
 * @returns {Promise<import('./Parcel.js').default[]>}
 */
async function applyPutdown(agent, ids = [], ack) {
    let result;
    try {
        result = await agent.actionMutex.execute(() => putDown(agent.grid, agent, ids)) || [];
    } catch (error) {
        console.error(`[parcel] Putdown error for ${agent.name}(${agent.id}):`, error.message);
        agent.penalty -= config.PENALTY;
        result = [];
    }
    if (ack) ack(result.map((parcel) => ({ id: parcel.id })));
    return result;
}

export { pickUp, putDown, applyPickup, applyPutdown };
