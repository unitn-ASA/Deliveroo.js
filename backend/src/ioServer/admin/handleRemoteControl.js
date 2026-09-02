import { myGrid } from '../../myGrid.js';

/**
 * Setup admin handlers to remotely control any agent.
 * Actions: move, pickup, putdown
 *
 * @param {import('@unitn-asa/deliveroo-js-sdk/server').DjsServerSocket} socket - Socket instance
 * @param {object} identity - Identity object
 */
export function handleRemoteControl(socket, identity) {

    console.log(`[ControlHandlers] Setting up control handlers for ${identity.name}`);

    /**
     * Remote control command handler
     * Actions: move, pickup, putdown
     */
    socket.on('agent:control', async ( agentId, action, params, ack) => {

        // Verify admin role
        if (identity.role !== 'admin') {
            console.warn(`[ControlHandlers] Unauthorized control attempt by ${identity.name}`);
            if (ack && typeof ack === 'function') {
                ack({ success: false, error: 'Unauthorized - admin role required' });
            }
            return;
        }

        // Get target agent
        const agent = myGrid.agentRegistry.get(agentId);
        if (!agent) {
            console.warn(`[ControlHandlers] Agent ${agentId} not found`);
            if (ack && typeof ack === 'function') {
                ack({ success: false, error: 'Agent not found' });
            }
            return;
        }

        console.log(`[ControlHandlers] ${identity.name} controlling ${agent.name}: ${action}`, params);

        try {
            let result;

            switch (action) {
                case 'move':
                    result = await agent.commands.execute('move', { direction: params.direction }, false);
                    break;

                case 'pickup':
                    result = await agent.commands.execute('pickup', {}, []);
                    break;

                case 'putdown':
                    // If selected parcels not provided, putdown all
                    const selected = params.selected || [];
                    result = await agent.commands.execute('putdown', { selected }, []);
                    break;

                default:
                    result = { success: false, error: 'Unknown action' };
            }

            if (ack && typeof ack === 'function') {
                ack({ success: true, result });
            }

            console.log(`[ControlHandlers] Control result:`, result);

        } catch (error) {
            console.error('[ControlHandlers] Control error:', error.message);
            if (ack && typeof ack === 'function') {
                ack({ success: false, error: error.message });
            }
        }
    });

    console.log(`✅ [ControlHandlers] Control handlers setup complete for ${identity.name}`);
}
