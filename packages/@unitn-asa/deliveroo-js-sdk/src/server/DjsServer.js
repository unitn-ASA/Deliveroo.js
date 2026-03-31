import { Server } from 'socket.io';
import { DjsServerSocket } from './DjsServerSocket.js';

/**
 * @typedef {import("../types/IOAgent.js").IOAgent} IOAgent
 * @typedef {import("../types/IOParcel.js").IOParcel} IOParcel
 * @typedef {import("../types/IOTile.js").IOTile} IOTile
 * @typedef {import("../types/IOConfig.js").IOConfig} IOConfig
 * @typedef {import("../types/IOInfo.js").IOInfo} IOInfo
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

    /**
     * Broadcast config to all connected clients
     * @param { IOConfig } config
     */
    broadcastConfig(config) {
        this.emit('config', config);
    }

    /**
     * Broadcast map to all connected clients
     * @param { number } width
     * @param { number } height
     * @param { IOTile[] } tiles
     */
    broadcastMap(width, height, tiles) {
        this.emit('map', width, height, tiles);
    }

    /**
     * Broadcast a tile update to all connected clients
     * @param { IOTile } tile
     */
    broadcastTile({ x, y, type }) {
        this.emit('tile', { x, y, type });
    }

    /**
     * Broadcast controller status (agent connected/disconnected) to all clients
     * @param { 'connected' | 'disconnected' } status
     * @param { Parameters<IOServerEvents['controller']>[1] } agent
     */
    broadcastController(status, { id, name, teamId, teamName, score }) {
        this.emit('controller', status, { id, name, teamId, teamName, score });
    }

    /**
     * Broadcast a message to all connected clients
     * @param { string } fromId
     * @param { string } fromName
     * @param { any } msg
     */
    broadcastMessage(fromId, fromName, msg) {
        this.emit('msg', fromId, fromName, msg);
    }

    /**
     * Broadcast a log message to all connected clients
     * @param { 'server' | { socket:string, id:string, name:string } } src - 'server' or client
     * @param { IOInfo } info
     * @param { ...any } message
     */
    broadcastLog(src, info, ...message) {
        this.emit('log', src, info, ...message);
    }

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
     * Enhance a Socket.io Server into a DjsServer
     * @param { Server } server
     * @returns { DjsServer }
     */
    static enhance(server) {
        /**
         * Mixin function to copy methods from a class prototype to an object
         */
        function applyMixin(target, MixinClass) {
            let proto = MixinClass.prototype;

            const descriptors = Object.getOwnPropertyDescriptors(proto);
            delete descriptors.constructor;

            Object.defineProperties(target, descriptors);

            return target;
        }
        applyMixin(server, DjsServer);

        /**
         * Original server enhanced with DjsServer methods
         * @type { DjsServer }
         */
        // @ts-ignore
        return server;
    }
}
