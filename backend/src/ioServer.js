const { Server } = require('socket.io');
const httpServer = require('./httpServer');
const { myGrid } = require('./grid');
const config = require('../config');
const myClock = require('./myClock');
require('events').EventEmitter.defaultMaxListeners = 200; // default is only 10! (https://nodejs.org/api/events.html#eventsdefaultmaxlisteners)
const {tokenMiddleware, signTokenMiddleware, verifyTokenMiddleware} = require('./middlewares/token');
const ioServerSocket = require('./ioServerSocket');
const Agent = require('./deliveroo/Agent');
const Identity = require('./deliveroo/Identity');
const Xy = require('./deliveroo/Xy');



const io = new Server( httpServer, {
    cors: {
        origin: "*", // http://localhost:3000",
        credentials: false, // https://socket.io/docs/v4/handling-cors/#credential-is-not-supported-if-the-cors-header-access-control-allow-origin-is-
        allowedHeaders: ["x-token"]
    }
} );

/**
 * Check token on Handshake
 * https://socket.io/docs/v4/middlewares/#compatibility-with-express-middleware
 */
io.engine.use( (req, res, next) => {
    
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

} )



io.on('connection', async ( socket ) => {

    const id = socket.request['user'].id;
    const name = socket.request['user'].name;
    const teamId = socket.request['user'].teamId;
    const teamName = socket.request['user'].teamName;
    const role = socket.request['user'].role;
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
    const me = myGrid.agents.get( id ) || myGrid.createAgent( identity );
    if ( !me ) return;
    if ( role == 'admin' ) { // former 'god' mod
        me.config.PARCELS_OBSERVATION_DISTANCE = 'infinite';
        me.config.AGENTS_OBSERVATION_DISTANCE = 'infinite';
        // await me.putDown();
        if  (me && me.tile && me.tile.unlock )
            me.tile.unlock();
        me.xy = undefined;
        myGrid.agents.delete( me.id );
        // myGrid.emit( 'agent deleted', me );
    }

    new ioServer( new ioServerSocket( socket ), me );

});



class ioServer {

    /**
     * @param { ioServerSocket } socket /**
     * @param { Agent } me
     */
    constructor( socket, me ) {

        const ioAgent = socket.to("agent:"+me.id);
        // const ioTeam = socket.to("team:"+me.teamId);

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
                if ( socketsLeft == 0 && me.xy ) {
                    
                    // console.log( `/${match.id}/${me.name}-${me.team}-${me.id} No connection left. In ${config.AGENT_TIMEOUT/1000} seconds agent will be removed.` );
                    await new Promise( res => setTimeout(res, config.AGENT_TIMEOUT) );
                    
                    let socketsLeft = (await ioAgent.fetchSockets()).length;
                    if ( socketsLeft == 0 && me.xy ) {
                        console.log( `${me.name}-${me.teamName}-${me.id} Agent deleted after ${config.AGENT_TIMEOUT/1000} seconds of no connections` );
                        myGrid.deleteAgent ( me );
                    };
                }

            } catch (error) {
                console.log('Error in the disconection of socket ', socket.id, ' -> ', error);
            }
            
        });


        
        /**
         * Kick agent
         */
        me.on( 'penalty', () => {
            if ( me.penalty < -1000 ) {
                console.log( `${me.name}-${me.teamName}-${me.id} is behaving too bad, automatically kicked with penalty ${me.penalty}` );
                socket.disconnect();
            }
        } );



        /**
         * Config
         */
        if ( me.identity.role == 'admin' ) { // former 'god' mod
            me.config.PARCELS_OBSERVATION_DISTANCE = 'infinite'
            me.config.AGENTS_OBSERVATION_DISTANCE = 'infinite'
        }
        socket.emit( 'config', me.config )

        

        /**
         * Emit map (tiles)
         */
        myGrid.onTile( ( { xy: {x,y}, type } ) => {
            socket.emitTile( {x, y, type} );
        } );
        let tiles = []
        for (const { xy: {x, y}, type } of myGrid.getTiles()) {
                // console.log( 'emit tile', x, y, type );
                socket.emitTile( {x, y, type} )
                tiles.push( {x, y, type} )
        }
        let {width, height} = myGrid.getMapSize()
        socket.emitMap( width, height, tiles )


        
        /**
         * Emit agents connecting/disconnecting
         */
        myGrid.agents.forEach( agent => {
            if ( ! agent.id ) return;
            let {id, name, teamName, teamId, score} = agent;
            socket.emitController( 'connected', {id, name, teamName, teamId, score} );
        } );
        myGrid.onAgent( 'created', ( event, agent ) => {
            if ( ! agent.id ) return;
            let {id, name, teamName, teamId, score} = agent;
            socket.emitController( 'connected', {id, name, teamName, teamId, score} );
        } );
        myGrid.onAgent( 'deleted', ( event, agent ) => {
            if ( ! agent.id ) return;
            let {id, name, teamName, teamId, score} = agent;
            socket.emitController( 'disconnected', {id, name, teamName, teamId, score} );
        } );
        

        
        /**
         * Emit me
         */

        // Emit you
        me.on( 'any', () => {
            // console.log( 'emit you', id, name, x, y, score );
            socket.emitYou( me );
        } );
        // console.log( 'emit you', id, name, x, y, score );
        socket.emitYou( {
            id: me.id, name: me.name,
            teamId: me.teamId, teamName: me.teamName,
            x: me.x, y: me.y,
            score: me.score,
            penalty: me.penalty
        } );
        


        /**
         * Emit sensing
         */

        // Parcels
        me.sensor.on( 'sensedParcels', () => {
            // console.log('emit parcels sensing', ...parcels);
            socket.emitParcelSensing( me.sensor.sensedParcels )
        } );
        // me.sensor.emitParcelSensing();

        // Agents
        me.sensor.on( 'sensedAgents', () => {
            // console.log('emit agents sensing', ...agents); // {id, name, x, y, score}
            socket.emitAgentsSensing( me.sensor.sensedAgents );
        } );
        // me.emitAgentSensing();
        


        /**
         * Actions
         */
        
        socket.onMove( async (direction, acknowledgementCallback) => {
            // console.log(me.id, me.x, me.y, direction);
            try {
                const moving = await me[direction.toString()]();
                if ( acknowledgementCallback )
                    acknowledgementCallback( moving ); //.bind(me)()
            } catch (error) { console.error(direction, 'is not a method of agent'); console.error(error) }
        });

        socket.onPickup( async (acknowledgementCallback) => {
            const picked = await me.pickUp()
            if ( acknowledgementCallback )
                try {
                    acknowledgementCallback( picked )
                } catch (error) { console.error(error) }
        });

        socket.onPutdown( async (selected, acknowledgementCallback) => {
            const dropped = await me.putDown( selected )
            if ( acknowledgementCallback )
                try {
                    acknowledgementCallback( dropped )
                } catch (error) { console.error(error) }
        });



        /**
         * Communication
         */

        socket.onSay( (toId, msg, acknowledgementCallback) => {
            
            console.log( me.id, me.name, 'say to', toId, msg );

            // console.log( me.id, me.name, 'emit \'msg\' on socket', socket.id, msg );
            socket.emitMsg( me, toId, msg );

            
            try {
                if (acknowledgementCallback) acknowledgementCallback( 'successful' )
            } catch (error) { console.log( me.id, 'acknowledgement of \'say\' not possible' ) }

        } )

        socket.onAsk( async (toId, msg, replyCallback) => {
            console.log( me.id, me.name, 'ask to', toId, msg );

            // console.log( me.id, 'socket', socket.id, 'emit msg', ...args );
            let reply = await socket.emitAsk( me, toId, msg);

            try {
                console.log( toId, 'replied', reply );
                replyCallback( reply )
            } catch (error) { console.log( me.id, 'error while trying to acknowledge reply' ) }

        } )

        socket.onShout( (msg, acknowledgementCallback) => {

            console.log( me.id, me.name, 'shout to everyone:', msg );
            
            socket.broadcastMsg( me, msg );

            try {
                if (acknowledgementCallback) acknowledgementCallback( 'successful' )
            } catch (error) { console.log( me.id, 'acknowledgement of \'shout\' not possible' ) }
            
        } )


        
        /**
         * Bradcast client log
         */
        if ( config.BROADCAST_LOGS ) {
            socket.onLog( ( ...message ) => {
                socket.broadcast.emit( 'log', {src: 'client', ms: myClock.ms, frame: myClock.frame, socket: socket.id, id: me.id, name: me.name}, ...message )
            } )
        }



        /**
         * GOD mod
         */
        if ( me.identity.role == 'admin' ) { // former 'god' mod

            socket.on( 'parcel', async (action, parcel, ack) => {
                console.log( 'parcel', action, parcel )
                if ( action == 'create' ) {
                    let createdParcel = myGrid.createParcel( new Xy(parcel.x, parcel.y) );
                    if ( parcel.reward )
                        createdParcel.reward = parcel.reward;
                }
                else if ( action == 'set' ) {
                    if ( myGrid.getParcel(parcel.id) )
                        myGrid.getParcel(parcel.id).reward = parcel.reward;
                }
                else if ( action == 'dispose' ) {
                    if ( parcel.id )
                        myGrid.deleteParcel( parcel.id )
                    else {
                        let parcels = Array.from( myGrid.getParcels() ).filter( p => p.x == parcel.x && p.y == parcel.y );
                        for ( let p of parcels)
                            myGrid.deleteParcel( p.id );
                    }
                }
                // TODO myGrid.emit( 'parcel' ); 
                // if ack is a funtion
                if ( ack && typeof ack === 'function' )
                    ack();
            } );

            socket.onTile( ( t ) => {
                // try { // handled in ioServerSocket .on

                    let { x, y, type } = t;
                    // console.log( 'God mode: tile', x, y, type );
                    let tile = myGrid.getTile( new Xy(x, y) )
                    if ( tile )
                        tile.type = type;

                // } catch (error) {
                //     console.warn( `WARN ${me.name}(${me.id}) on('tile', ${t}).`, error.message );
                // }
            } );

            socket.onRestart( () => {
                console.log( 'Restart' );
                myGrid.restart();
            } );

        }

    }

}



/**
 * Broadcast server log
 */
const oldLog = console.log;
global.console.log = function ( ...message ) {
    if ( config.BROADCAST_LOGS ) {
        io.emit( 'log', {src: 'server', timestamp: {ms: myClock.ms, frame: myClock.frame}}, ...message );
    };
    oldLog.apply( console, message );
}



module.exports = io;