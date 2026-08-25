import { Server } from 'socket.io';
import { DjsServerSocket } from './DjsServerSocket.js';

/**
 * @typedef {import("../types/IOAgent.js").IOAgent} IOAgent
 * @typedef {import("../types/IOParcel.js").IOParcel} IOParcel
 * @typedef {import("../types/IOTile.js").IOTile} IOTile
 * @typedef {import("../types/IOConfig.js").IOConfig} IOConfig
 * @typedef {import("../types/IOMetrics.js").IOMetrics} IOMetrics
 *
 * @typedef {import("../types/IOSocketEvents.js").IOSensing} IOSensing
 * @typedef {import("../types/IOSocketEvents.js").IOClientEvents} IOClientEvents on the client side these are to be emitted with .emit
 * @typedef {import("../types/IOSocketEvents.js").IOServerEvents} IOServerEvents on the client side these are to be listened with .on
 */

/**
 * @class
 * @extends { Server<IOClientEvents, IOServerEvents> }
 */
export class DjsServer extends Server {

    // /**
    //  * Get all sockets in a room
    //  * @param { string } roomName
    //  * @returns { Promise<import('./DjsServerSocket.js').DjsServerSocket[]> }
    //  */
    // async fetchSocketsInRoom(roomName) {
    //     const sockets = await this.in(roomName).fetchSockets();
    //     return sockets.forEach(s => DjsServerSocket.enhance(s));
    // }

    // /**
    //  * Count sockets in a room
    //  * @param { string } roomName
    //  * @returns { Promise<number> }
    //  */
    // async countSocketsInRoom(roomName) {
    //     const sockets = await this.fetchSocketsInRoom(roomName);
    //     return sockets.length;
    // }

    // /**
    //  * Emit to all sockets in a specific room
    //  * @param { string } roomName
    //  * @param { string } event
    //  * @param { ...any } args
    //  */
    // emitToRoom(roomName, event, ...args) {
    //     this.to(roomName).emit(event, ...args);
    // }

    /**
     * Enhance a Socket.io Server into a DjsServer with methods from DjsServerSocket
     * @param { Server } server
     * @returns { DjsServer }
     */
    static enhance(server) {
        return server;
    }
}
