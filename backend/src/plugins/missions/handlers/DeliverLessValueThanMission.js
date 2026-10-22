import MissionBase from '../MissionBase.js';

/**
 * DeliverLessValueThan: bonus when an agent delivers a non-empty batch of
 * parcels whose total reward is strictly less than the threshold (a
 * "deliver small parcels" challenge).
 */
class DeliverLessValueThanMission extends MissionBase {

    /** @type {number} */
    #threshold = 10;

    /**
     * @param {import('../MissionBase.js').MissionDescriptor} descriptor
     * @param {number} index
     */
    constructor(descriptor, index) {
        super(descriptor, index);
        this.#threshold = Number(descriptor.threshold ?? 10);
    }

    activate() {
        this.observePutdowns();
    }

    /**
     * @param {import('../MissionBase.js').PutdownHookContext & {result: any}} context
     */
    onPutdown({ agent, result }) {
        if (!agent.tile?.delivery) return;
        if (!Array.isArray(result) || result.length === 0) return;
        if (!this.canClaim(agent.id)) return;
        const value = result.reduce((sum, parcel) => sum + (Number(parcel?.reward) || 0), 0);
        if (value >= this.#threshold) return;
        this.award(agent, `delivered value ${value}`);
    }

    /**
     * @returns {object}
     */
    describe() {
        return { ...super.describe(), config: { threshold: this.#threshold } };
    }

}

export default DeliverLessValueThanMission;
