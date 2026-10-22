import MissionBase from '../MissionBase.js';

/**
 * OnePickupAnotherDeliver: bonus when an agent delivers on a delivery tile
 * a parcel that was picked up by a different agent; both the pickup and
 * the delivering agent are awarded. Each parcel can trigger the mission
 * once.
 */
class OnePickupAnotherDeliverMission extends MissionBase {

    /** @type {Map<string, string>} parcel id -> picking agent id */
    #pickupAgents = new Map();

    /** @type {Set<string>} parcels already awarded */
    #awardedParcels = new Set();

    /**
     * @param {import('../MissionBase.js').MissionDescriptor} descriptor
     * @param {number} index
     */
    constructor(descriptor, index) {
        super(descriptor, index);
    }

    activate() {
        this.observePickups();
        this.observePutdowns();
    }

    /**
     * @param {import('../MissionBase.js').PickupHookContext & {result: any}} context
     */
    onPickup({ agent, result }) {
        if (!Array.isArray(result)) return;
        for (const parcel of result) {
            if (parcel?.id) this.#pickupAgents.set(parcel.id, agent.id);
        }
    }

    /**
     * @param {import('../MissionBase.js').PutdownHookContext & {result: any}} context
     */
    onPutdown({ agent, result }) {
        if (!agent.tile?.delivery || !Array.isArray(result)) return;

        for (const parcel of result) {
            if (!parcel?.id || this.#awardedParcels.has(parcel.id)) continue;
            const pickupAgentId = this.#pickupAgents.get(parcel.id);
            if (!pickupAgentId || pickupAgentId === agent.id) continue;
            this.#awardedParcels.add(parcel.id);

            const pickupAgent = this.grid.agents.get(pickupAgentId);
            if (pickupAgent && this.canClaim(pickupAgent.id)) {
                this.award(pickupAgent, `parcel handed over by ${agent.name}`);
            }
            if (this.canClaim(agent.id)) {
                this.award(agent, `delivered a parcel picked up by ${pickupAgent?.name ?? pickupAgentId}`);
            }
        }
    }

    onReArm() {
        this.#pickupAgents.clear();
        this.#awardedParcels.clear();
    }

}

export default OnePickupAnotherDeliverMission;
