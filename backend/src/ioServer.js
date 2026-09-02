import { Server } from 'socket.io';
import httpServer from './httpServer.js';
import { EventEmitter } from 'events';
EventEmitter.defaultMaxListeners = 200;
import { signTokenMiddleware, verifyTokenMiddleware } from './middlewares/token.js';
import { DjsServer, DjsServerSocket } from '@unitn-asa/deliveroo-js-sdk/server';
import Identity from './core/Identity.js';
import { config } from './config/config.js';
import { broadcastConfig } from './ioServer/broadcast/broadcastConfig.js';
import { broadcastControllersConnections } from './ioServer/broadcast/broadcastControllersConnections.js';
import { broadcastMetrics } from './ioServer/broadcast/broadcastMetrics.js';
import { handleCommunications } from './ioServer/handlers/handleCommunications.js';
import { handleClientsLogAndBroadcastToAdmins } from './ioServer/handlers/handleClientsLogAndBroadcastToAdmins.js';
import { setupPingPongTracking } from './ioServer/emitters/setupPingPongTracking.js';
import { emitMapAndTiles } from './ioServer/emitters/emitMapAndTiles.js';
import { attachConnectionComponents } from './ioServer/connectionComponents/attachConnectionComponents.js';



const enhancedIoServer = DjsServer.enhance( new Server( httpServer, {
    cors: {
        origin: "*", // http://localhost:3000",
        credentials: false, // https://socket.io/docs/v4/handling-cors/#credential-is-not-supported-if-the-cors-header-access-control-allow-origin-is-
        allowedHeaders: ["x-token"]
    }
} ) );



/**
 * Check token on Handshake
 * https://socket.io/docs/v4/middlewares/#compatibility-with-express-middleware
 */
enhancedIoServer.engine.use( (req, res, next) => {

    try {
        // check if handshake
        const isHandshake = req._query.sid === undefined;
        if ( ! isHandshake ) {
            return next();
        }

        // set query consistently as in express.js middlewares
        req.query = req._query;

        verifyTokenMiddleware(req, res, () => {
            signTokenMiddleware(req, res, next);
        } );
    } catch (error) {
        console.error( 'Error in handshake middleware:', error );
        next( error );
    }

} );



// Setup metrics broadcasting
broadcastMetrics(enhancedIoServer);
// enhanceEmitter( myClock ).on( '1s', () =>
//     socket.emit('metrics', myPerformanceMonitor.getPerformanceMetrics())
// ).untilDisconnect( enhancedIoSocket ).emitNow();
            
// Controller Connections broadcasting
broadcastControllersConnections(enhancedIoServer);



enhancedIoServer.on('connection', async ( socket ) => {

    try {
        const id = socket.request['user']?.id;
        const name = socket.request['user']?.name;
        const teamId = socket.request['user']?.teamId;
        const teamName = socket.request['user']?.teamName;
        const role = socket.request['user']?.role;

        if ( !id || !name ) {
            console.error( 'Invalid user data in connection request', socket.request['user'] );
            socket.disconnect();
            return;
        }

        const identity = new Identity( id, name, teamId, teamName, role );

        /** @type {string} */
        const token = socket.request['token'] || '';

        socket.emit( 'token', token );

        console.log( `[ioServer] Socket ${socket.id} connected as ${role} ${name}(${id}).`);

        // Enhance socket once with DjsServerSocket
        const enhancedIoSocket = DjsServerSocket.enhance(socket);

        // broadcast Config to clients on connection and on updates
        broadcastConfig(enhancedIoSocket);

        // Map/tiles broadcasting (universal: players and admin observers)
        emitMapAndTiles(enhancedIoSocket);

        // Setup ping/pong latency tracking
        setupPingPongTracking(enhancedIoSocket, identity);

        // Setup communication handlers (universal for all identities)
        handleCommunications(enhancedIoSocket, identity);

        // Setup log broadcasting for this socket
        handleClientsLogAndBroadcastToAdmins(enhancedIoSocket, identity);

        // Role-specific connection components (player/admin). No role
        // knowledge here: the map in attachConnectionComponents decides.
        const attached = await attachConnectionComponents(enhancedIoSocket, identity);
        if ( ! attached ) {
            socket.disconnect();
            return;
        }

    } catch (error) {
        console.error( 'Error in connection handler:', error );
        socket.disconnect();
    }

});






/**
 * Broadcast server log
 */
try {
    const oldLog = console.log;
    global.console.log = function ( ...message ) {
        try {
            if ( config.BROADCAST_LOGS ) {
                enhancedIoServer.emit( 'log', 'server', ...message );
            };
        } catch (e) {
            // Ignore errors in log broadcasting
        }
        oldLog.apply( console, message );
    }
} catch (error) {
    console.error( 'Error setting up log broadcasting:', error );
}



export default enhancedIoServer;
