import { handleRemoteControl } from '../admin/handleRemoteControl.js';
import { handleTeleport } from '../admin/handleTeleport.js';
import { handleAdminCommands } from '../admin/handleAdminCommands.js';
import { emitGodSensing } from '../emitters/emitGodSensing.js';

/**
 * Per-connection behavior for admin identities: map-wide observers with
 * no physical agent on the map.
 *
 * Emits an identity-only 'you' (no position, no score) plus god sensing
 * (all tiles, agents, parcels, crates, kept up to date), and registers
 * the remote-control, teleport and admin command handlers. Acting on the
 * game happens through remote control of other agents, never as a self.
 */
class AdminConnectionComponent {

    id = 'admin-connection';

    /**
     * @param {import('@unitn-asa/deliveroo-js-sdk/server').DjsServerSocket} socket
     * @param {import('../../deliveroo/Identity.js').default} identity
     * @returns {Promise<boolean>}
     */
    async start(socket, identity) {

        await socket.join("admins");

        // Identity-only 'you': an observer has no map position; neutral score
        socket.emitYou({
            id: identity.id,
            name: identity.name,
            teamId: identity.teamId,
            teamName: identity.teamName,
            score: 0,
            penalty: 0,
            rotation: null
        });

        // Map-wide sensing updates (all tiles, agents, parcels, crates)
        emitGodSensing(socket);

        // Setup on agent:control handler for admin to control any agent
        handleRemoteControl(socket, identity);

        // Setup agent:teleport handler for admin to teleport any agent
        handleTeleport(socket, identity);

        // Setup admin command handlers: parcel, crate, tile, restart, reward
        handleAdminCommands(socket, identity);

        return true;
    }

}

export default AdminConnectionComponent;
