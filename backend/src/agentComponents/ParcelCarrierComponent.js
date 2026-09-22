import { config } from '../config/config.js';
import { pickUp, putDown } from '../core/parcelActions.js';
import { actionHooks } from '../core/actions/ActionHooks.js';

class ParcelCarrierComponent {
    id = 'parcel-carrier';

    start(agent) {
        agent.commands.handle('pickup', ({ ack }) => void this.applyPickup(agent, ack), this.id,
            { description: 'Pick up all the parcels on the current tile' });
        agent.commands.handle('putdown', ({ selected, ack }) => void this.applyPutdown(agent, selected, ack), this.id,
            { description: 'Drop carried parcels (all of them when no selection)' });
    }

    stop(agent) {
        agent.commands.release('pickup', this.id);
        agent.commands.release('putdown', this.id);
    }

    /**
     * Pickup under the agent action mutex, acknowledged exactly once.
     * Extension pickup handlers (batteries, keys, ...) take priority over
     * the core parcel pickup.
     * @param {import('../core/Agent.js').default} agent
     * @param {(picked: any) => void} [ack]
     * @returns {Promise<any>}
     */
    async applyPickup(agent, ack) {
        let result;
        try {
            result = await agent.actionMutex.execute(async () => {
                const grid = agent.grid;
                const context = { agent, grid, xy: agent.xy?.rounded };

                const intercepted = await actionHooks.runPickup(context);
                if (intercepted !== undefined) {
                    return intercepted;
                }

                const picked = pickUp(grid, agent);
                await actionHooks.runAfterPickup({ ...context, result: picked });
                return picked;
            }) ?? [];
        } catch (error) {
            console.error(`[parcel] Pickup error for ${agent.name}(${agent.id}):`, error.message);
            agent.penalty -= config.PENALTY;
            result = [];
        }
        if (ack) ack(result);
        return result;
    }

    /**
     * Putdown under the agent action mutex, acknowledged exactly once.
     * Extension putdown handlers (double delivery, ...) take priority over
     * the core parcel putdown.
     * @param {import('../core/Agent.js').default} agent
     * @param {string[]} [selected]
     * @param {(dropped: {id: string}[]) => void} [ack]
     * @returns {Promise<{id: string}[]>}
     */
    async applyPutdown(agent, selected = [], ack) {
        let result;
        try {
            result = await agent.actionMutex.execute(async () => {
                const grid = agent.grid;
                const context = { agent, grid, selected };

                const intercepted = await actionHooks.runPutdown(context);
                let dropped;
                if (intercepted !== undefined) {
                    dropped = intercepted;
                } else {
                    dropped = putDown(grid, agent, selected);
                }
                await actionHooks.runAfterPutdown({ ...context, result: dropped });
                return dropped;
            }) ?? [];
        } catch (error) {
            console.error(`[parcel] Putdown error for ${agent.name}(${agent.id}):`, error.message);
            agent.penalty -= config.PENALTY;
            result = [];
        }
        if (ack) ack(result.map((parcel) => ({ id: parcel.id })));
        return result;
    }
}

export default ParcelCarrierComponent;
