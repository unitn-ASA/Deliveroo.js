import PlayerConnectionComponent from './PlayerConnectionComponent.js';
import AdminConnectionComponent from './AdminConnectionComponent.js';

/**
 * Role-specific connection components. The map is the single place that
 * knows which role gets which components — ioServer.js holds no role
 * branching.
 *
 * - user: plays as an agent on the map
 * - admin: agent-less map-wide observer acting through remote control
 */
const ROLE_CONNECTION_COMPONENTS = {
    user: [PlayerConnectionComponent],
    admin: [AdminConnectionComponent]
};

/**
 * Instantiate and start the connection components for an identity's role.
 * Unknown roles fall back to the 'user' set.
 * @param {import('@unitn-asa/deliveroo-js-sdk/server').DjsServerSocket} socket
 * @param {import('../../core/Identity.js').default} identity
 * @returns {Promise<boolean>} false when a component aborted the chain
 */
async function attachConnectionComponents(socket, identity) {
    const components = ROLE_CONNECTION_COMPONENTS[identity.role] ?? ROLE_CONNECTION_COMPONENTS.user;
    for (const ComponentClass of components) {
        const component = new ComponentClass();
        const ok = await component.start(socket, identity);
        if (ok === false) {
            console.error(`[attachConnectionComponents] ${component.id} aborted setup for ${identity.name}(${identity.id}) as ${identity.role}`);
            return false;
        }
    }
    return true;
}

export { attachConnectionComponents, ROLE_CONNECTION_COMPONENTS };
