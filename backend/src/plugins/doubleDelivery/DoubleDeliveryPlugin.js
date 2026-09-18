import PluginBase from '../PluginBase.js';
import { actionHooks } from '../../core/actions/ActionHooks.js';

/** Double-delivery tile type owned by this plugin */
const isDoubleDelivery = (tile) => tile?.type === '9';

/**
 * Double Delivery plugin: parcels delivered on double-delivery tiles ('9')
 * are scored twice their reward.
 *
 * Registered as an intercepting putdown handler on the action hook
 * pipeline: on a '9' tile the delivery applies the doubled reward, anywhere
 * else the core putdown rule applies unchanged.
 */
class DoubleDeliveryPlugin extends PluginBase {

    constructor() {
        super({
            id: 'double-delivery',
            name: 'Double Delivery',
            version: '1.0.0',
            description: 'Parcels delivered on \"9\" tiles are scored twice their reward'
        });
    }

    /**
     * @param {import('../PluginBase.js').PluginContext} context
     * @returns {Promise<boolean>}
     */
    async init(context) {
        void context;
        actionHooks.putdown('double-delivery', 10, (ctx) => this.#deliverDouble(ctx));
        console.log('[DoubleDeliveryPlugin] Double Delivery started: "9" tiles score x2');
        return true;
    }

    /**
     * @param {import('../PluginBase.js').PluginContext} context
     * @returns {Promise<boolean>}
     */
    async shutdown(context) {
        void context;
        actionHooks.offPutdown('double-delivery');
        console.log('[DoubleDeliveryPlugin] Double Delivery stopped');
        return true;
    }

    /**
     * Intercepting putdown handler: deliver carried parcels on a
     * double-delivery tile with doubled reward. Returns undefined anywhere
     * else so the core putdown rule applies.
     * @param {import('../../core/actions/ActionHooks.js').PutdownHookContext} ctx
     * @returns {import('../../core/Parcel.js').default[] | undefined}
     */
    #deliverDouble({ agent, selected }) {
        if (!isDoubleDelivery(agent.tile)) {
            return undefined;
        }

        let scoreAdded = 0;
        const delivered = [];
        let toDeliver = Array.from(agent.carryingParcels.values());

        if (selected && selected.length > 0) {
            toDeliver = toDeliver.filter((parcel) => selected.includes(parcel.id));
        }

        for (const parcel of toDeliver) {
            agent.carryingParcels.delete(parcel);
            parcel.carriedBy = null;
            delivered.push(parcel);
            scoreAdded += parcel.reward * 2;
            parcel.delete();
        }

        if (delivered.length > 0) {
            agent.score += scoreAdded;
        }
        return delivered;
    }

}

export default DoubleDeliveryPlugin;
