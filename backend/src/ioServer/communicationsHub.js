import EventEmitter from 'events';

/**
 * Server-wide communications hub: the bridge between socket-level
 * say/shout/ask traffic and server-side components (plugins) that need to
 * hear agents or address them.
 *
 * Inbound 'msg' events are published by the communication handlers for
 * every socket; outbound 'announce' events are broadcast by ioServer.js to
 * all connected clients as ordinary 'msg' events from a server identity.
 *
 * @typedef {{channel: 'say'|'shout'|'ask', fromId: string, fromName: string, toId: string|null, msg: any}} HubMessage
 * @typedef {{fromId: string, fromName: string, msg: any}} HubAnnouncement
 *
 * @extends {EventEmitter<{
 *      "msg": [message: HubMessage],
 *      "announce": [announcement: HubAnnouncement]
 * }>}
 */
class CommunicationsHub extends EventEmitter {

    constructor() {
        super();
        this.setMaxListeners(0);
    }

    /**
     * Publish a message sent by an agent (observability only: the socket
     * delivery flow is unchanged).
     * @param {{channel: 'say'|'shout'|'ask', fromId: string, fromName: string, toId?: string|null, msg: any}} message
     */
    publishMsg({ channel, fromId, fromName, toId = null, msg }) {
        this.emit('msg', { channel, fromId, fromName, toId, msg });
    }

    /**
     * Broadcast a server-side announcement to every connected client.
     * @param {{fromId?: string, fromName?: string, msg: any}} announcement
     */
    announce({ fromId = 'server', fromName = 'Server', msg }) {
        this.emit('announce', { fromId, fromName, msg });
    }

}

/**
 * Shared singleton so communication handlers and plugins resolve the same
 * hub without import cycles.
 * @type {CommunicationsHub}
 */
const communicationsHub = new CommunicationsHub();

export { communicationsHub, CommunicationsHub };
