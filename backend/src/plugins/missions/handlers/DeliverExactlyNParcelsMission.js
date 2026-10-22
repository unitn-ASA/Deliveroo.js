import MissionBase from '../MissionBase.js';

/**
 * DeliverExactlyNParcels: bonus when an agent delivers exactly N parcels
 * with a single putdown on a delivery tile.
 */
class DeliverExactlyNParcelsMission extends MissionBase {

    /** @type {number} */
    #parcels = 1;

    /**
     * @param {import('../MissionBase.js').MissionDescriptor} descriptor
     * @param {number} index
     */
    constructor(descriptor, index) {
        super(descriptor, index);
        this.#parcels = Math.max(1, Math.floor(Number(descriptor.parcels ?? 1)));
    }

    activate() {
        this.observePutdowns();
    }

    /**
     * @param {import('../MissionBase.js').PutdownHookContext & {result: any}} context
     */
    onPutdown({ agent, result }) {
        if (!agent.tile?.delivery) return;
        if (!Array.isArray(result) || result.length !== this.#parcels) return;
        if (!this.canClaim(agent.id)) return;
        this.award(agent);
    }

    /**
     * @returns {object}
     */
    describe() {
        return { ...super.describe(), config: { parcels: this.#parcels } };
    }

}

export default DeliverExactlyNParcelsMission;
