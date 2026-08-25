import { Server } from 'socket.io';
import httpServer from './httpServer.js';
import { myGrid } from './myGrid.js';
import { config, configEmitter } from './config/config.js';
import myClock from './myClock.js';
import { EventEmitter } from 'events';
EventEmitter.defaultMaxListeners = 200;
import { signTokenMiddleware, verifyTokenMiddleware } from './middlewares/token.js';
import { DjsServer, DjsServerSocket } from '@unitn-asa/deliveroo-js-sdk/server';
import Identity from './deliveroo/Identity.js';
import { broadcastConfig } from './ioServer/broadcast/broadcastConfig.js';
import { emitMapAndTiles } from './ioServer/emitters/emitMapAndTiles.js';
import { broadcastControllersConnections } from './ioServer/broadcast/broadcastControllersConnections.js';
import { emitYou } from './ioServer/emitters/emitYou.js';
import { emitSensing } from './ioServer/emitters/emitSensing.js';
import { handleCommunications } from './ioServer/handlers/handleCommunications.js';
import { handleClientsLogAndBroadcastToAdmins } from './ioServer/handlers/handleClientsLogAndBroadcastToAdmins.js';
import { handleActions } from './ioServer/handlers/handleActions.js';
import { handleRemoteControl } from './ioServer/admin/handleRemoteControl.js';
import { handleTeleport } from './ioServer/admin/handleTeleport.js';
import { handleAdminCommands } from './ioServer/admin/handleAdminCommands.js';
import { deleteAgentWhenNoConnectionsLeft } from './ioServer/connections/deleteAgentWhenNoConnectionsLeft.js';
import { setupPingPongTracking } from './ioServer/emitters/setupPingPongTracking.js';
import { broadcastMetrics } from './ioServer/broadcast/broadcastMetrics.js';
import { disconnectWhenPenaltyExceeded } from './ioServer/connections/disconnectWhenPenaltyExceeded.js';
import { emitNowAndListenToEmitterUntilDisconnect, enhanceEmitter } from './ioServer/utils/emitNowAndListenToEmitterUntilDisconnect.js';
import { pluginRegistry } from './plugins/runtime.js';
import MovementPlugin from './plugins/builtins/MovementPlugin.js';



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



/**
 * Default plugins: movement is a plugin owning the 'move' command.
 * Stop it (REST /api/plugins/movement-standard/stop) and register+start
 * another movement plugin to switch scheme at runtime.
 */
const movementPlugin = pluginRegistry.register(new MovementPlugin());
pluginRegistry.start(movementPlugin.id)
    .then(ok => ok
        ? console.log(`✅ Plugin ${movementPlugin.id} started`)
        : console.error(`❌ Failed to start plugin ${movementPlugin.id}:`, movementPlugin.lastError))
    .catch(error => console.error(`❌ Failed to start plugin ${movementPlugin.id}:`, error));



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

        // Join agent-specific rooms
        await enhancedIoSocket.join("agent:"+id);
        await enhancedIoSocket.join("team:"+teamId);

        // broadcast Config to clients on connection and on updates
        broadcastConfig(enhancedIoSocket);

        // Setup ping/pong latency tracking
        setupPingPongTracking(enhancedIoSocket, identity);

        // Setup communication handlers (universal for all identities)
        handleCommunications(enhancedIoSocket, identity);

        // Setup log broadcasting for this socket
        handleClientsLogAndBroadcastToAdmins(enhancedIoSocket, identity);

        // Only if agent
        if ( true ) {

            // Create Agent entity on map
            const me = myGrid.agentRegistry.get( id ) || myGrid.createAgent( identity );
            if ( !me ) {
                console.error( `Failed to get or create agent for ${id}` );
                socket.disconnect();
                return;
            }
            // Turn on sensing for this agent
            me.sensor.turnOn();
    
            // Setup connection lifecycle handlers
            deleteAgentWhenNoConnectionsLeft(enhancedIoSocket, me);

            // Setup penalty-based auto-kick
            disconnectWhenPenaltyExceeded(enhancedIoSocket, me);
            // enhanceEmitter( me.emitter ).on( 'penalty', () => {
            //     if (me.penalty < -1000) {
            //         console.log(`${me.name}-${me.teamName}-${me.id} is behaving too bad, automatically kicked with penalty ${me.penalty}`);
            //         socket.disconnect();
            //     }
            // } ).untilDisconnect( enhancedIoSocket );

            // Map/tiles broadcasting
            emitMapAndTiles(enhancedIoSocket);
            // enhanceEmitter( myGrid.emitter ).on( 'map', () => {
            //     enhancedIoSocket.emitMap(myGrid.tileRegistry.getMaxX(), myGrid.tileRegistry.getMaxY(), [...myGrid.tileRegistry.getIterator()].map( ({x,y,type}) => ({x,y,type}) ) );
            // } ).untilDisconnect( enhancedIoSocket ).emitNow();
            
            // "Me" state updates
            emitYou(enhancedIoSocket, me);
            
            // Sensing updates
            emitSensing(enhancedIoSocket, me);
            
            // Setup action handlers (dispatched through the command bus)
            handleActions(enhancedIoSocket, me);

        }

        if ( role === 'admin' ) {

            socket.join("admins");

            // Setup on agent:control handler for admin to control any agent
            handleRemoteControl(enhancedIoSocket, identity);

            // Setup agent:teleport handler for admin to teleport any agent
            handleTeleport(enhancedIoSocket, identity);
            
            // Setup admin command handlers: parcel, crate, tile, restart, reward
            handleAdminCommands(enhancedIoSocket, identity);

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
