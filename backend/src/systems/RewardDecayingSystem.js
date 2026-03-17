import { config } from '../config/config.js';

/**
 * RewardDecayingSystem provides parcel reward calculation and decay functions.
 * Minimal system - no tracking, no lifecycle methods.
 */
class RewardDecayingSystem {

    /**
     * Calculate initial reward for a new parcel.
     * @param {number} [overrideReward] - Optional override value
     * @returns {number}
     */
    calculateReward(overrideReward) {
        if (overrideReward !== undefined) {
            return overrideReward;
        }

        const random = Math.random();
        const variance = config.GAME.parcels.reward_variance;
        const avg = config.GAME.parcels.reward_avg;

        return Math.floor((random * variance * 2) + (avg - variance));
    }

    /**
     * Decay reward for a parcel by 1.
     * @param {import('../deliveroo/Parcel.js').default} parcel
     * @returns {boolean} True if parcel expired (reward <= 0)
     */
    decayParcel(parcel) {
        if (parcel.expired) {
            return false;
        }

        parcel.reward = Math.floor(parcel.reward - 1);

        if (parcel.reward <= 0) {
            parcel.expired = true;
            return true;
        }

        return false;
    }
}

export default RewardDecayingSystem;
