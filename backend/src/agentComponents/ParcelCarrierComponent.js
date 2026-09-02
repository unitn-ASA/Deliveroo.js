import { applyPickup, applyPutdown } from '../core/parcelActions.js';

class ParcelCarrierComponent {
    id = 'parcel-carrier';

    start(agent) {
        agent.commands.handle('pickup', ({ ack }) => void applyPickup(agent, ack), this.id);
        agent.commands.handle('putdown', ({ selected, ack }) => void applyPutdown(agent, selected, ack), this.id);
    }

    stop(agent) {
        agent.commands.release('pickup', this.id);
        agent.commands.release('putdown', this.id);
    }
}

export default ParcelCarrierComponent;
