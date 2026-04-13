console.log('ioServer.js loaded');

import { Server } from 'socket.io';
import httpServer from './httpServer.js';
import { myGrid } from './myGrid.js';
import { config, configEmitter } from './config/config.js';
import myClock from './myClock.js';
import myPerformanceMonitor from './myPerformanceMonitor.js';
import events from 'events';
events.EventEmitter.defaultMaxListeners = 200; // default is only 10! (https://nodejs.org/api/events.html#eventsdefaultmaxlisteners);
import { signTokenMiddleware, verifyTokenMiddleware } from './middlewares/token.js';
import { DjsServer, DjsServerSocket } from '@unitn-asa/deliveroo-js-sdk/server';
import Agent from './deliveroo/Agent.js';
import Identity from './deliveroo/Identity.js';
import Xy from './deliveroo/Xy.js';
import { atNextTick } from './reactivity/postponeAt.js';

/** @typedef {import('@unitn-asa/deliveroo-js-sdk/types/IOSensing.js').IOSensing} IOSensing */


const io = DjsServer.enhance( new Server( httpServer, {
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
io.engine.use( (req, res, next) => {

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

} )



io.on('connection', async ( socket ) => {

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

        const identity = new Identity( id, name, teamId, teamName, role, socket.id );

        /** @type {string} */
        const token = socket.request['token'] || '';

        socket.emit( 'token', token );

        console.log( `Socket ${socket.id} connected as ${role} ${name}(${id}). With token: ${token.slice(0,10)}...` );

        await socket.join("agent:"+id);
        await socket.join("team:"+teamId);
        const ioAgent = socket.to("agent:"+id);
        const ioTeam = socket.to("team:"+teamId);

        /**
         * Get or create agent
         */
        const me = myGrid.agentRegistry.get( id ) || myGrid.createAgent( identity );
        if ( !me ) {
            console.error( `Failed to get or create agent for ${id}` );
            socket.disconnect();
            return;
        }

        // Manually turn on sensing for this agent
        me.sensor.turnOn();

        // If admin, reset position and unlock tile to allow free movement and avoid issues with locked tiles when controlling other agents
        if ( role == 'admin' ) { // former 'god' mod
            // await me.putDown();
            try {
                if  (me && me.tile && me.tile.unlock )
                    me.tile.unlock();
                me.xy = undefined;
            } catch (e) {
                console.warn( 'Error setting up admin mode:', e.message );
            }

            // Remove agent from spatial registry is not needed! AgentFactory already tracks xy changes and update spatial registry
            // myGrid.agentRegistry.remove( me.id );

            // myGrid.emitter.emit( 'agent deleted', me );
        }

        new ioServer( DjsServerSocket.enhance( socket ), me );

    } catch (error) {
        console.error( 'Error in connection handler:', error );
        socket.disconnect();
    }

});



class ioServer {

    /**
     * @param { DjsServerSocket } socket /**
     * @param { Agent } me
     */
    constructor( socket, me ) {

        try {
            const ioAgent = socket.to("agent:"+me.id);
            // const ioTeam = socket.to("team:"+me.teamId);

            /**
             * on Disconnect
             */
            socket.onDisconnect( async (cause) => {

                // Clear latency samples for this socket
                myPerformanceMonitor.clearLatencySamples(socket.id);

                try{
                    let socketsLeft = (await ioAgent.fetchSockets()).length;
                    console.log( `${me.name}-${me.teamName}-${me.id} Socket disconnected.`,
                        socketsLeft ?
                        `Other ${socketsLeft} connections to the agent.` :
                        `No other connections, agent will be removed in ${config.AGENT_TIMEOUT/1000} seconds.`
                    );

                    if ( socketsLeft == 0 && me.xy ) {

                        // stop sensing immediately to avoid unnecessary computations while waiting for potential reconnection
                        me.sensor.turnOff();

                        // wait for potential reconnection before deleting agent
                        await new Promise( res => setTimeout(res, config.AGENT_TIMEOUT) );

                        // finally, check again if there are connections before deleting agent
                        let socketsLeft = (await ioAgent.fetchSockets()).length;
                        if ( socketsLeft == 0 && me.xy ) {
                            console.log( `${me.name}-${me.teamName}-${me.id} Agent deleted after ${config.AGENT_TIMEOUT/1000} seconds of no connections` );
                            me.delete();
                        };
                    }

                } catch (error) {
                    console.log('Error in the disconection of socket ', socket.id, ' -> ', error);
                }

            });


            /**
             * Ping/Pong latency tracking using acknowledgements
             */
            try {
                const PING_INTERVAL = 1000; // Send ping every 1 second

                // Send periodic pings with acknowledgement callback
                const pingInterval = setInterval(() => {
                    try {
                        const pingData = {
                            timestamp: performance.now()
                        };

                        // Send ping to client with acknowledgement callback
                        socket.emit('ping', pingData, (ackData) => {
                            try {
                                // Handle the acknowledgement (pong response) from client
                                if (ackData && typeof ackData === 'object') {
                                    // Pass agent information to associate with latency
                                    const agentInfo = {
                                        id: me.id,
                                        name: me.name,
                                        teamId: me.teamId,
                                        teamName: me.teamName
                                    };
                                    const latencyData = myPerformanceMonitor.handlePong(socket.id, pingData, ackData, agentInfo);
                                    if (latencyData) {
                                        // Optional: log high latency
                                        if (latencyData.roundTrip > 200) {
                                            console.log(`${me.name}-${me.teamName}-${me.id} High latency: ${latencyData.roundTrip}ms (network: ${latencyData.networkLag}ms)`);
                                        }
                                    }
                                }
                            } catch (error) {
                                console.warn('Error handling ping acknowledgement:', error.message);
                            }
                        });
                    } catch (error) {
                        console.warn('Error sending ping:', error.message);
                    }
                }, PING_INTERVAL);

                // Cleanup ping interval on disconnect
                socket.onDisconnect(() => {
                    clearInterval(pingInterval);
                });

            } catch (error) {
                console.warn('Error setting up ping/pong:', error.message);
            }


            /**
             * Admin Dashboard - Broadcast detailed performance metrics
             */
            if (me.identity?.role == 'admin') {
                try {
                    console.log(`[ioServer] Setting up admin metrics for ${me.name} (${socket.id})`);

                    // Send initial metrics immediately
                    const initialMetrics = myPerformanceMonitor.getPerformanceMetrics();
                    // console.log('[ioServer] Sending initial metrics:', initialMetrics);
                    socket.emit('metrics', initialMetrics);

                    // Send metrics every second
                    const metricsInterval = setInterval(() => {
                        try {
                            const metrics = myPerformanceMonitor.getPerformanceMetrics();
                            // console.log('[ioServer] Sending metrics update:', metrics);
                            socket.emit('metrics', metrics);
                        } catch (error) {
                            console.warn('Error sending metrics:', error.message);
                        }
                    }, 1000);

                    // Cleanup on disconnect
                    socket.onDisconnect(() => {
                        clearInterval(metricsInterval);
                    });

                    console.log(`${me.name} connected as admin - broadcasting performance metrics`);
                } catch (error) {
                    console.warn('Error setting up admin metrics:', error.message);
                }
            }


            /**
             * Kick agent
             */
            try {
                // Listen for penalty changes to auto-kick bad behaving agents
                const penaltyListener = () => {
                    try {
                        if ( me.penalty < -1000 ) {
                            console.log( `${me.name}-${me.teamName}-${me.id} is behaving too bad, automatically kicked with penalty ${me.penalty}` );
                            socket.disconnect();
                        }
                    } catch (error) {
                        console.warn( 'Error in penalty listener:', error.message );
                    }
                };
                me.emitter.on( 'penalty', penaltyListener );

                // Cleanup listeners to prevent memory leak
                socket.onDisconnect( () => {
                    me.emitter.off( 'penalty', penaltyListener );
                } );
            } catch (error) {
                console.error( 'Error setting up penalty listener:', error.message );
            }



            /**
             * Config
             */
            try {
                socket.emitConfig( config );
            } catch (error) {
                console.error( 'Error emitting config:', error.message );
            }



            /**
             * Emit map (tiles)
             */
            try {
                // Emit tile updates
                const tileListener = ( { xy: {x,y}, type } ) => {
                    try {
                        socket.emitTile( {x, y, type} );
                    } catch (e) {
                        console.warn( 'Error emitting tile update:', e.message );
                    }
                };
                myGrid.emitter.onTile( tileListener );

                // Emit all tiles for initial map state
                let tiles = []
                for (const { xy: {x, y}, type } of myGrid.tileRegistry.getIterator()) {
                    try {
                        socket.emitTile( {x, y, type} );
                        tiles.push( {x, y, type} );
                    } catch (e) {
                        console.warn( 'Error emitting initial tile:', e.message );
                    }
                }

                // Emit initial map state as bulk (optional, can be used by clients to optimize initial loading)
                socket.emitMap( myGrid.tileRegistry.getMaxX(), myGrid.tileRegistry.getMaxY(), tiles );

                // Cleanup listeners to prevent memory leak
                socket.onDisconnect( () => {
                    myGrid.emitter.offTile( tileListener );
                } );

            } catch (error) {
                console.error( 'Error setting up map emission:', error.message );
            }


            /**
             * Emit agents connecting/disconnecting
             */
            try {
                // Emit existing agents
                Array.from( myGrid.agentRegistry.getIterator() ).forEach( agent => {
                    try {
                        if ( ! agent?.id ) return;
                        let {id, name, teamName, teamId, score} = agent;
                        socket.emitController( 'connected', {id, name, teamName, teamId, score} );
                    } catch (e) {
                        console.warn( 'Error emitting agent controller:', e.message );
                    }
                } );

                // Listen for new agents
                const agentCreatedListener = ( event, agent ) => {
                    try {
                        if ( ! agent?.id ) return;
                        let {id, name, teamName, teamId, score} = agent;
                        socket.emitController( 'connected', {id, name, teamName, teamId, score} );
                    } catch (e) {
                        console.warn( 'Error in agent created listener:', e.message );
                    }
                };
                myGrid.emitter.onAgentCreated( agentCreatedListener );

                // Listen for deleted agents
                const agentDeletedListener = ( event, agent ) => {
                    try {
                        if ( ! agent?.id ) return;
                        let {id, name, teamName, teamId, score} = agent;
                        socket.emitController( 'disconnected', {id, name, teamName, teamId, score} );
                    } catch (e) {
                        console.warn( 'Error in agent deleted listener:', e.message );
                    }
                };
                myGrid.emitter.onAgentDeleted( agentDeletedListener );
                
                // Cleanup listeners on disconnect
                socket.onDisconnect( () => {
                    if ( agentCreatedListener ) {
                        myGrid.emitter.offAgentCreated( agentCreatedListener );
                    }
                    if ( agentDeletedListener ) {
                        myGrid.emitter.offAgentDeleted( agentDeletedListener );
                    }
                } );
            } catch (error) {
                console.error( 'Error setting up agent emission:', error.message );
            }




            /**
             * Emit me
             */

            try {
                // Emit you
                const meAnyListener = atNextTick( () => {
                    try {
                        socket.emitYou( me );
                    } catch (e) {
                        console.warn( 'Error emitting me update:', e.message );
                    }
                } );
                me.emitter.on( 'xy', meAnyListener );
                me.emitter.on( 'score', meAnyListener );
                me.emitter.on( 'penalty', meAnyListener );
                me.emitter.on( 'carryingParcels', meAnyListener );
                socket.emitYou( {
                    id: me.id, name: me.name,
                    teamId: me.teamId, teamName: me.teamName,
                    x: me.x, y: me.y,
                    score: me.score,
                    penalty: me.penalty
                } );

                // Cleanup listeners on disconnect to prevent memory leak
                socket.onDisconnect( () => {
                    me.emitter.off( 'xy', meAnyListener );
                    me.emitter.off( 'score', meAnyListener );
                    me.emitter.off( 'penalty', meAnyListener );
                    me.emitter.off( 'carryingParcels', meAnyListener );
                } );
            } catch (error) {
                console.error( 'Error setting up me emission:', error.message );
            }




            /**
             * Emit sensing
             */
            try {
                /** @type {function(IOSensing): void} */
                const sensingListener = ( sensing ) => {
                    try {
                        socket.emitSensing( sensing );
                    } catch (e) {
                        console.warn( 'Error emitting sensing:', e.message );
                    }
                };
                me.sensor.emitter.on( 'sensing', sensingListener );
                
                // Trigger computeSensing() to emit initial sensing on connection
                me.sensor.computeSensing();

                // Cleanup listeners on disconnect to prevent memory leak
                socket.onDisconnect( () => {
                    me.sensor.emitter.off( 'sensing', sensingListener );
                } );
            } catch (error) {
                console.error( 'Error setting up sensing:', error.message );
            }




            /**
             * Actions
             */

            socket.onMove( async (direction, acknowledgementCallback) => {
                // console.log(me.id, me.x, me.y, direction);
                try {
                    // Validate direction
                    if ( typeof direction !== 'string' || !['up', 'down', 'left', 'right'].includes(direction) ) {
                        throw new Error( `Invalid direction: ${direction}` );
                    }

                    var moving;
                    switch (direction) {
                        case 'up':
                            moving = await me.controller.up();
                            break;
                        case 'down':
                            moving = await me.controller.down();
                            break;
                        case 'left':
                            moving = await me.controller.left();
                            break;
                        case 'right':
                            moving = await me.controller.right();
                            break;
                        default:
                            throw new Error( `Direction ${direction} is not valid!` );
                    }
                    if ( acknowledgementCallback )
                        acknowledgementCallback( moving ); //.bind(me)()
                } catch (error) {
                    me.penalty -= config.PENALTY;
                    console.warn( `${me.name}(${me.id}) got penalty ${me.penalty}: onMove() error - ${error.message}` );
                    if ( acknowledgementCallback )
                        acknowledgementCallback( false );
                }
            });

            socket.onPickup( async (acknowledgementCallback) => {
                try {
                    const picked = await me.controller.pickUp();
                    if ( acknowledgementCallback )
                        acknowledgementCallback( picked );
                } catch (error) {
                    console.warn( `${me.name}(${me.id}) pickup error: ${error.message}` );
                    if ( acknowledgementCallback )
                        acknowledgementCallback( [] );
                }
            });

            socket.onPutdown( async (selected, acknowledgementCallback) => {
                try {
                    // Validate selected is array
                    if ( !Array.isArray(selected) ) {
                        selected = [];
                    }
                    const dropped = await me.controller.putDown( selected );
                    if ( acknowledgementCallback )
                        acknowledgementCallback( dropped );
                } catch (error) {
                    console.warn( `${me.name}(${me.id}) putdown error: ${error.message}` );
                    if ( acknowledgementCallback )
                        acknowledgementCallback( [] );
                }
            });



            /**
             * Communication
             */

            socket.onSay( (toId, msg, acknowledgementCallback) => {
                try {
                    // Validate inputs
                    if ( typeof toId !== 'string' ) {
                        console.warn( 'Invalid toId in onSay' );
                        // if ( acknowledgementCallback ) acknowledgementCallback( 'failed' );
                        return;
                    }

                    socket.emitMsg( me, toId, msg );

                    if (acknowledgementCallback) acknowledgementCallback( 'successful' );
                } catch (error) {
                    console.log( me.id, 'error in onSay:', error.message );
                }
            } )

            socket.onAsk( async (toId, msg, replyCallback) => {
                try {
                    // Validate inputs
                    if ( typeof toId !== 'string' ) {
                        console.warn( 'Invalid toId in onAsk' );
                        if ( replyCallback ) replyCallback( null );
                        return;
                    }

                    let reply = await socket.emitAsk( me, toId, msg );

                    if ( replyCallback ) replyCallback( reply );
                } catch (error) {
                    console.log( me.id, 'error in onAsk:', error.message );
                    if ( replyCallback ) replyCallback( null );
                }
            } )

            socket.onShout( (msg, acknowledgementCallback) => {
                try {
                    socket.broadcastMsg( me, msg );

                    if (acknowledgementCallback) acknowledgementCallback( 'successful' );
                } catch (error) {
                    console.log( me.id, 'error in onShout:', error.message );
                }
            } )




            /**
             * Bradcast client log
             */
            try {
                const logListener = ( ...message ) => {
                    try {
                        socket.broadcast.emit( 'log', {socket: socket.id, id: me.id, name: me.name}, ...message );
                    } catch (error) {
                        console.warn( 'Error broadcasting log:', error.message );
                    }
                }
                const configListener = ( v ) => {
                    try {
                        if ( v  && ! socket.listeners('log').includes( logListener ) ) {
                            socket.on( 'log', logListener );
                        } else {
                            socket.off( 'log', logListener );
                        }
                    } catch (error) {
                        console.warn( 'Error in config listener for logs:', error.message );
                    }
                } 
                configEmitter.on('BROADCAST_LOGS', configListener);

                // Cleanup listeners on disconnect to prevent memory leak
                socket.onDisconnect( () => {
                    socket.off( 'log', logListener );
                    configEmitter.off('BROADCAST_LOGS', configListener);
                });
            } catch (error) {
                console.error( 'Error setting up log listener:', error.message );
            }



            /**
             * GOD mod
             */
            if ( me.identity?.role == 'admin' ) { // former 'god' mod

                socket.on( 'parcel', async (action, parcel, ack) => {
                    try {
                        if ( typeof action !== 'string' || !parcel || typeof parcel !== 'object' ) {
                            console.warn( 'Invalid parcel command' );
                            if ( ack && typeof ack === 'function' ) ack();
                            return;
                        }

                        console.log( 'parcel', action, parcel );
                        if ( action == 'create' ) {
                            if ( typeof parcel.x !== 'number' || typeof parcel.y !== 'number' ) {
                                console.warn( 'Invalid parcel coordinates' );
                                if ( ack && typeof ack === 'function' ) ack();
                                return;
                            }
                            let createdParcel = myGrid.createParcel( new Xy(parcel.x, parcel.y) );
                            if ( parcel.reward && typeof parcel.reward === 'number' )
                                createdParcel.reward = parcel.reward;
                        }
                        else if ( action == 'set' ) {
                            if ( !parcel.id ) {
                                console.warn( 'Parcel ID required for set action' );
                                if ( ack && typeof ack === 'function' ) ack();
                                return;
                            }
                            let p = myGrid.parcelRegistry.get(parcel.id);
                            if ( p && typeof parcel.reward === 'number' )
                                p.reward = parcel.reward;
                        }
                        else if ( action == 'dispose' ) {
                            if ( parcel.id ) {
                                let p = myGrid.parcelRegistry.get(parcel.id);
                                if ( p ) p.delete();
                            } else {
                                if ( typeof parcel.x !== 'number' || typeof parcel.y !== 'number' ) {
                                    console.warn( 'Invalid parcel coordinates for dispose' );
                                    if ( ack && typeof ack === 'function' ) ack();
                                    return;
                                }
                                let parcels = Array.from( myGrid.parcelRegistry.getIterator() ).filter( p => p.x == parcel.x && p.y == parcel.y );
                                for ( let p of parcels )
                                    myGrid.parcelRegistry.get(p.id)?.delete();
                            }
                        }
                        if ( ack && typeof ack === 'function' )
                            ack();
                    } catch (error) {
                        console.error( 'Error in parcel command:', error.message );
                        if ( ack && typeof ack === 'function' ) ack();
                    }
                } );

                socket.on( 'crate', async (action, data, ack) => {
                    try {
                        if ( typeof action !== 'string' || !data || typeof data !== 'object' ) {
                            console.warn( 'Invalid crate command' );
                            if ( ack && typeof ack === 'function' ) ack();
                            return;
                        }

                        console.log( 'crate', action, data );
                        if ( action == 'create' ) {
                            if ( typeof data.x !== 'number' || typeof data.y !== 'number' ) {
                                console.warn( 'Invalid crate coordinates' );
                                if ( ack && typeof ack === 'function' ) ack();
                                return;
                            }
                            myGrid.createCrate( new Xy(data.x, data.y) );
                        }
                        else if ( action == 'dispose' ) {
                            if ( data.id ) {
                                let c = myGrid.crateRegistry.get(data.id);
                                if ( c ) c.delete();
                            } else {
                                if ( typeof data.x !== 'number' || typeof data.y !== 'number' ) {
                                    console.warn( 'Invalid crate coordinates for dispose' );
                                    if ( ack && typeof ack === 'function' ) ack();
                                    return;
                                }
                                let crates = Array.from( myGrid.crateRegistry.getIterator() ).filter( c => c.x == data.x && c.y == data.y );
                                for ( let c of crates )
                                    myGrid.crateRegistry.get(c.id)?.delete();
                            }
                        }
                        if ( ack && typeof ack === 'function' )
                            ack();
                    } catch (error) {
                        console.error( 'Error in crate command:', error.message );
                        if ( ack && typeof ack === 'function' ) ack();
                    }
                } );

                socket.onTile( ( t ) => {
                    try {
                        if ( !t || typeof t !== 'object' ) {
                            console.warn( 'Invalid tile data' );
                            return;
                        }

                        let { x, y, type } = t;
                        if ( typeof x !== 'number' || typeof y !== 'number' || typeof type !== 'string' ) {
                            console.warn( 'Invalid tile coordinates or type' );
                            return;
                        }

                        let tile = myGrid.tileRegistry.getOneByXy( {x, y} );
                        if ( tile )
                            tile.type = type;
                    } catch (error) {
                        console.warn( `Error in tile command: ${error.message}` );
                    }
                } );

                socket.onRestart( () => {
                    try {
                        console.log( 'Restart' );
                        myGrid.restart();
                    } catch (error) {
                        console.error( 'Error restarting grid:', error.message );
                    }
                } );

            }

        } catch (error) {
            console.error( 'Error in ioServer constructor:', error );
        }

    }

}



/**
 * Broadcast info
 */
myClock.on('1s', () => io.emit( 'info', myPerformanceMonitor.info ) );



/**
 * Broadcast server log
 */
try {
    const oldLog = console.log;
    global.console.log = function ( ...message ) {
        try {
            if ( config.BROADCAST_LOGS ) {
                io.emit( 'log', 'server', ...message );
            };
        } catch (e) {
            // Ignore errors in log broadcasting
        }
        oldLog.apply( console, message );
    }
} catch (error) {
    console.error( 'Error setting up log broadcasting:', error );
}



export default io;
