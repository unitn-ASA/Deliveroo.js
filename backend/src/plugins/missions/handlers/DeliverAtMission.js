import MissionBase from '../MissionBase.js';

/**
 * DeliverAt: bonus (or penalty with a negative bonus) when an agent puts
 * down parcels at one of the mission coordinates. By default the putdown
 * must be a delivery (on a delivery tile); requireDelivery: false watches
 * for any putdown at the coordinates.
 */
class DeliverAtMission extends MissionBase {

    /** @type {{x: number, y: number}[]} */
    #coordinates = [];

    /** @type {boolean} */
    #requireDelivery = true;

    /**
     * @param {import('../MissionBase.js').MissionDescriptor} descriptor
     * @param {number} index
     */
    constructor(descriptor, index) {
        super(descriptor, index);
        this.#coordinates = (Array.isArray(descriptor.coordinates) ? descriptor.coordinates : [])
            .map((xy) => ({ x: Number(xy?.x), y: Number(xy?.y) }))
            .filter((xy) => Number.isFinite(xy.x) && Number.isFinite(xy.y));
        this.#requireDelivery = descriptor.requireDelivery ?? true;
    }

    activate() {
        this.observePutdowns();
    }

    /**
     * @param {import('../MissionBase.js').PutdownHookContext & {result: any}} context
     */
    onPutdown({ agent }) {
        if (this.#requireDelivery && !agent.tile?.delivery) return;
        const xy = agent.xy?.rounded;
        if (!xy || !this.canClaim(agent.id)) return;
        if (!this.#coordinates.some((target) => target.x === xy.x && target.y === xy.y)) return;
        this.award(agent);
    }

    /**
     * @returns {object}
     */
    describe() {
        return { ...super.describe(), config: { coordinates: this.#coordinates, requireDelivery: this.#requireDelivery } };
    }

}

export default DeliverAtMission;
