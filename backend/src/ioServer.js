console.log('ioServer.js loaded');

import { Server } from 'socket.io';
import httpServer from './httpServer.js';
import { myGrid } from './myGrid.js';
import { config } from './config/config.js';
import myClock from './myClock.js';
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
        if ( role == 'admin' ) { // former 'god' mod
            // me.config.OBSERVATION_DISTANCE = 'infinite';
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

            // Store all listener references for cleanup
            const listeners = {
                tileListener: null,
                agentCreatedListener: null,
                agentDeletedListener: null,
                meAnyListener: null,
                /** @type {function(IOSensing): void} */
                sensingListener: null,
                sensedParcelsListener: null,
                sensedAgentsListener: null,
                penaltyListener: null
            };

            /**
             * on Disconnect
             */
            socket.onDisconnect( async (cause) => {

                try{
                    let socketsLeft = (await ioAgent.fetchSockets()).length;
                    console.log( `${me.name}-${me.teamName}-${me.id} Socket disconnected.`,
                        socketsLeft ?
                        `Other ${socketsLeft} connections to the agent.` :
                        `No other connections, agent will be removed in ${config.AGENT_TIMEOUT/1000} seconds.`
                    );

                    // Cleanup listeners to prevent memory leak
                    if ( listeners.tileListener ) {
                        myGrid.emitter.offTile( listeners.tileListener );
                    }
                    if ( listeners.agentCreatedListener ) {
                        myGrid.emitter.offAgent( listeners.agentCreatedListener );
                    }
                    if ( listeners.agentDeletedListener ) {
                        myGrid.emitter.offAgent( listeners.agentDeletedListener );
                    }
                    if ( listeners.meAnyListener ) {
                        me.emitter.off( 'xy', listeners.meAnyListener );
                        me.emitter.off( 'score', listeners.meAnyListener );
                        me.emitter.off( 'penalty', listeners.meAnyListener );
                        me.emitter.off( 'carryingParcels', listeners.meAnyListener );
                    }
                    if ( listeners.sensedParcelsListener ) {
                        me.sensor.emitter.off( 'sensing', listeners.sensedParcelsListener );
                    }
                    if ( listeners.sensedAgentsListener ) {
                        me.sensor.emitter.off( 'sensing', listeners.sensedAgentsListener );
                    }
                    if ( listeners.penaltyListener ) {
                        me.emitter.off( 'penalty', listeners.penaltyListener );
                    }

                    if ( socketsLeft == 0 && me.xy ) {

                        // console.log( `/${match.id}/${me.name}-${me.team}-${me.id} No connection left. In ${serverConfig.AGENT_TIMEOUT/1000} seconds agent will be removed.` );
                        await new Promise( res => setTimeout(res, config.AGENT_TIMEOUT) );

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
             * Kick agent
             */
            listeners.penaltyListener = () => {
                try {
                    if ( me.penalty < -1000 ) {
                        console.log( `${me.name}-${me.teamName}-${me.id} is behaving too bad, automatically kicked with penalty ${me.penalty}` );
                        socket.disconnect();
                    }
                } catch (error) {
                    console.warn( 'Error in penalty listener:', error.message );
                }
            };
            me.emitter.on( 'penalty', listeners.penaltyListener );



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
                listeners.tileListener = ( { xy: {x,y}, type } ) => {
                    try {
                        socket.emitTile( {x, y, type} );
                    } catch (e) {
                        console.warn( 'Error emitting tile update:', e.message );
                    }
                };
                myGrid.emitter.onTile( listeners.tileListener );
                let tiles = []
                for (const { xy: {x, y}, type } of myGrid.tileRegistry.getIterator()) {
                    try {
                        socket.emitTile( {x, y, type} );
                        tiles.push( {x, y, type} );
                    } catch (e) {
                        console.warn( 'Error emitting initial tile:', e.message );
                    }
                }
                socket.emitMap( myGrid.tileRegistry.getMaxX(), myGrid.tileRegistry.getMaxY(), tiles );
            } catch (error) {
                console.error( 'Error setting up map emission:', error.message );
            }


            /**
             * Emit agents connecting/disconnecting
             */
            try {
                Array.from( myGrid.agentRegistry.getIterator() ).forEach( agent => {
                    try {
                        if ( ! agent?.id ) return;
                        let {id, name, teamName, teamId, score} = agent;
                        socket.emitController( 'connected', {id, name, teamName, teamId, score} );
                    } catch (e) {
                        console.warn( 'Error emitting agent controller:', e.message );
                    }
                } );
                listeners.agentCreatedListener = ( event, agent ) => {
                    try {
                        if ( ! agent?.id ) return;
                        let {id, name, teamName, teamId, score} = agent;
                        socket.emitController( 'connected', {id, name, teamName, teamId, score} );
                    } catch (e) {
                        console.warn( 'Error in agent created listener:', e.message );
                    }
                };
                myGrid.emitter.onAgent( 'created', listeners.agentCreatedListener );

                listeners.agentDeletedListener = ( event, agent ) => {
                    try {
                        if ( ! agent?.id ) return;
                        let {id, name, teamName, teamId, score} = agent;
                        socket.emitController( 'disconnected', {id, name, teamName, teamId, score} );
                    } catch (e) {
                        console.warn( 'Error in agent deleted listener:', e.message );
                    }
                };
                myGrid.emitter.onAgent( 'deleted', listeners.agentDeletedListener );
            } catch (error) {
                console.error( 'Error setting up agent emission:', error.message );
            }




            /**
             * Emit me
             */

            try {
                // Emit you
                listeners.meAnyListener = atNextTick( () => {
                    try {
                        socket.emitYou( me );
                    } catch (e) {
                        console.warn( 'Error emitting me update:', e.message );
                    }
                } );
                me.emitter.on( 'xy', listeners.meAnyListener );
                me.emitter.on( 'score', listeners.meAnyListener );
                me.emitter.on( 'penalty', listeners.meAnyListener );
                me.emitter.on( 'carryingParcels', listeners.meAnyListener );
                socket.emitYou( {
                    id: me.id, name: me.name,
                    teamId: me.teamId, teamName: me.teamName,
                    x: me.x, y: me.y,
                    score: me.score,
                    penalty: me.penalty
                } );
            } catch (error) {
                console.error( 'Error setting up me emission:', error.message );
            }




            /**
             * Emit sensing
             */
            try {
                listeners.sensingListener = ( sensing ) => {
                    try {
                        socket.emitSensing( sensing );
                    } catch (e) {
                        console.warn( 'Error emitting sensing:', e.message );
                    }
                };
                me.sensor.emitter.on( 'sensing', listeners.sensingListener );
                // Compute sensing to emit initial sensing on connection
                me.sensor.computeSensing();
            } catch (error) {
                console.error( 'Error setting up sensing:', error.message );
            }




            /**
             * Emit info
             */
            try {
                myClock.on('frame', () => {
                    try {
                        socket.emitInfo( myClock.info );
                    } catch (e) {
                        // Ignore errors in info emission to avoid spam
                    }
                } );
            } catch (error) {
                console.error( 'Error setting up info emission:', error.message );
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
            if ( config.BROADCAST_LOGS ) {
                socket.onLog( ( ...message ) => {
                    try {
                        socket.broadcast.emit( 'log', {socket: socket.id, id: me.id, name: me.name}, myClock.info, ...message );
                    } catch (error) {
                        console.warn( 'Error broadcasting log:', error.message );
                    }
                } )
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
 * Broadcast server log
 */
try {
    const oldLog = console.log;
    global.console.log = function ( ...message ) {
        try {
            if ( config.BROADCAST_LOGS ) {
                io.emit( 'log', 'server', myClock.info, ...message );
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
