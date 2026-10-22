import Identity from '../../core/Identity.js';
import myClock from '../../myClock.js';
import { communicationsHub } from '../communicationsHub.js';

/**
 * Setup communication handlers for any identity
 * Works for both agent and non-agent identities
 *
 * @param {import('@unitn-asa/deliveroo-js-sdk/server').DjsServerSocket} socket - Socket instance
 * @param {Identity} identity - Identity object
 */
export function handleCommunications(socket, identity) {

    const { id: fromId, name: fromName } = identity;

    console.log(`[CommunicationHandlers] Setting up communication for ${identity.name} (${identity.role})`);

    /**
     * Say: 1-to-1 message
     */
    socket.onSay( (toId, msg, ack) => {
        if (!toId || !msg) {
            if (ack) ack("failed") // { success: false, error: 'Invalid parameters' }
            return "failed";
        }

        console.log(`[CommunicationHandlers] ${fromName}(${fromId}) saying to ${toId}: ${msg}`);

        communicationsHub.publishMsg({ channel: 'say', fromId, fromName, toId, msg });

        socket.emitMsg(fromId, fromName, toId, msg);

        if (ack) ack("successful") // { success: true }
        return "successful";
    });

    /**
     * Ask: Request-reply message
     */
    socket.onAsk( async (toId, msg, ack) => {
        if (!toId || !msg) {
            if (ack) ack({ success: false, error: 'Invalid parameters' });
            return;
        }

        console.log(`[CommunicationHandlers] ${fromName} asking ${toId}: ${msg}`);

        communicationsHub.publishMsg({ channel: 'ask', fromId, fromName, toId, msg });

        const reply = await socket.emitAsk(fromId, fromName, toId, msg);
        console.log(`[CommunicationHandlers] Received reply from ${toId} to ${fromName}: ${reply}`);
        if (ack) ack(reply);
    });

    /**
     * Shout: Broadcast message
     */
    socket.onShout( (msg, ack) => {
        if (!msg) {
            if (ack) ack({ success: false, error: 'Invalid parameters' });
            return;
        }

        console.log(`[CommunicationHandlers] ${fromName} shouting: ${msg}`);

        communicationsHub.publishMsg({ channel: 'shout', fromId, fromName, toId: null, msg });

        socket.broadcastMsg(fromId, fromName, msg); // Emit to self

        if (ack) ack({ success: true });
    });

    console.log(`✅ [CommunicationHandlers] Communication setup complete for ${identity.name}`);
}
