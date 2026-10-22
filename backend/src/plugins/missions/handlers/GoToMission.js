import MissionBase from '../MissionBase.js';

/**
 * GoTo: bonus (or penalty with a negative bonus) when an agent reaches one
 * of the mission coordinates. With unatantum (default) each agent claims
 * it once; with unatantum: false every visit awards again.
 */
class GoToMission extends MissionBase {

    /** @type {{x: number, y: number}[]} */
    #coordinates = [];

    /**
     * @param {import('../MissionBase.js').MissionDescriptor} descriptor
     * @param {number} index
     */
    constructor(descriptor, index) {
        super(descriptor, index);
        this.#coordinates = (Array.isArray(descriptor.coordinates) ? descriptor.coordinates : [])
            .map((xy) => ({ x: Number(xy?.x), y: Number(xy?.y) }))
            .filter((xy) => Number.isFinite(xy.x) && Number.isFinite(xy.y));
    }

    activate() {
        this.observeMoves();
    }

    /**
     * @param {import('../MissionBase.js').MoveHookContext} context
     */
    onMove({ agent }) {
        const xy = agent.xy?.rounded;
        if (!xy || !this.canClaim(agent.id)) return;
        if (!this.#coordinates.some((target) => target.x === xy.x && target.y === xy.y)) return;
        this.award(agent);
    }

    /**
     * @returns {object}
     */
    describe() {
        return { ...super.describe(), config: { coordinates: this.#coordinates } };
    }

}

export default GoToMission;
