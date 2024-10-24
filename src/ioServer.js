const { Server } = require('socket.io');
const httpServer = require('./httpServer');
const myGrid = require('./grid');
const {BROADCAST_LOGS, AGENT_TIMEOUT} = require('../config');
const myClock = require('./deliveroo/Clock');
require('events').EventEmitter.defaultMaxListeners = 200; // default is only 10! (https://nodejs.org/api/events.html#eventsdefaultmaxlisteners)
const {tokenMiddleware, signTokenMiddleware, verifyTokenMiddleware} = require('./middlewares/token');



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



io.on('connection', async (socket) => {

    const id = socket.request['user'].id;
    const name = socket.request['user'].name;
    const teamId = socket.request['user'].teamId;
    const teamName = socket.request['user'].teamName;
    /** @type {string} */
    const token = socket.request['token'] || '';
    
    socket.emit( 'token', token );
    
    console.log( `Socket ${socket.id} connected as ${name}(${id}). With token: ${token.slice(0,10)}...` );

    await socket.join("agent:"+id);
    await socket.join("team:"+teamId);
    const ioAgent = socket.to("agent:"+id);
    const ioTeam = socket.to("team:"+teamId);
    
    const me = myGrid.getAgent( id ) || myGrid.createAgent( {id: id, name} );
    if ( !me ) return;



    /**
     * on Disconnect
     */
    socket.on( 'disconnect', async (cause) => {

        try{

            let socketsLeft = (await ioAgent.fetchSockets()).length;
            console.log( `${me.name}-${me.teamName}-${me.id} Socket disconnected.`,
                socketsLeft ?
                `Other ${socketsLeft} connections to the agent.` :
                `No other connections, agent will be removed in ${AGENT_TIMEOUT/1000} seconds.`
            );
            if ( socketsLeft == 0 && myGrid.getAgent(me.id) ) {
                
                // console.log( `/${match.id}/${me.name}-${me.team}-${me.id} No connection left. In ${AGENT_TIMEOUT/1000} seconds agent will be removed.` );
                await new Promise( res => setTimeout(res, AGENT_TIMEOUT) );
                
                let socketsLeft = (await ioAgent.fetchSockets()).length;
                if ( socketsLeft == 0 && myGrid.getAgent(me.id) ) {
                    console.log( `${me.name}-${me.teamName}-${me.id} Agent deleted after ${AGENT_TIMEOUT/1000} seconds of no connections` );
                    myGrid.deleteAgent ( me );
                };
            }

        } catch (error) {
            console.log('Error in the disconection of socket ', socket.id, ' -> ', error);
        }
        
    });



    /**
     * Config
     */
    if ( me.name == 'god' ) { // 'god' mod
        me.config.PARCELS_OBSERVATION_DISTANCE = 'infinite'
        me.config.AGENTS_OBSERVATION_DISTANCE = 'infinite'
    }
    socket.emit( 'config', me.config )

    

    /**
     * Emit map (tiles)
     */
    myGrid.on( 'tile', ({x, y, delivery, blocked, parcelSpawner}) => {
        // console.log( 'emit tile', x, y, delivery, parcelSpawner );
        if (!blocked)
            socket.emit( 'tile', x, y, delivery, parcelSpawner );
        else
            socket.emit( 'not_tile', x, y );
    } );
    let tiles = []
    for (const {x, y, delivery, blocked, parcelSpawner} of myGrid.getTiles()) {
        if ( !blocked ) {
            socket.emit( 'tile', x, y, delivery, parcelSpawner )
            tiles.push( {x, y, delivery, parcelSpawner} )
        } else
            socket.emit( 'not_tile', x, y );
    }
    let {width, height} = myGrid.getMapSize()
    socket.emit( 'map', width, height, tiles )
    

    
    /**
     * Emit me
     */

    // Emit you
    me.on( 'agent', ({id, name, x, y, score}) => {
        // console.log( 'emit you', id, name, x, y, score );
        socket.emit( 'you', {id, name, x, y, score} );
    } );
    // console.log( 'emit you', id, name, x, y, score );
    socket.emit( 'you', {
        id: me.id,
        name: me.name,
        x: me.x,
        y: me.y,
        score: me.score
    } );
    


    /**
     * Emit sensing
     */

    // Parcels
    me.on( 'parcels sensing', (parcels) => {
        // console.log('emit parcels sensing', ...parcels);
        socket.emit('parcels sensing', parcels )
    } );
    me.emitParcelSensing();

    // Agents
    me.on( 'agents sensing', (agents) => {
        // console.log('emit agents sensing', ...agents); // {id, name, x, y, score}
        socket.emit( 'agents sensing', agents );
    } );
    me.emitAgentSensing();
    


    /**
     * Actions
     */
    
    socket.on('move', async (direction, acknowledgementCallback) => {
        // console.log(me.id, me.x, me.y, direction);
        try {
            const moving = me[direction]();
            if ( acknowledgementCallback )
                acknowledgementCallback( await moving ); //.bind(me)()
        } catch (error) { console.error(direction, 'is not a method of agent'); console.error(error) }
    });

    socket.on('pickup', async (acknowledgementCallback) => {
        const picked = await me.pickUp()
        if ( acknowledgementCallback )
            try {
                acknowledgementCallback( picked )
            } catch (error) { console.error(error) }
    });

    socket.on('putdown', async (selected, acknowledgementCallback) => {
        const dropped = await me.putDown( selected )
        if ( acknowledgementCallback )
            try {
                acknowledgementCallback( dropped )
            } catch (error) { console.error(error) }
    });



    /**
     * Communication
     */

    socket.on( 'say', (toId, msg, acknowledgementCallback) => {
        
        // console.log( me.id, me.name, 'say ', toId, msg );

        // console.log( me.id, me.name, 'emit \'msg\' on socket', socket.id, msg );
        socket.to("agent:"+toId).emit( 'msg', me.id, me.name, msg );

        
        try {
            if (acknowledgementCallback) acknowledgementCallback( 'successful' )
        } catch (error) { console.log( me.id, 'acknowledgement of \'say\' not possible' ) }

    } )

    socket.on( 'ask', (toId, msg, replyCallback) => {
        // console.log( me.id, me.name, 'ask', toId, msg );

        // console.log( me.id, 'socket', socket.id, 'emit msg', ...args );
        socket.to("agent:"+toId).emit( 'msg', me.id, me.name, msg, (reply) => {

            try {
                console.log( toId, 'replied', reply );
                replyCallback( reply )
            } catch (error) { console.log( me.id, 'error while trying to acknowledge reply' ) }

        } );

    } )

    socket.on( 'shout', (msg, acknowledgementCallback) => {

        // console.log( me.id, me.name, 'shout', msg );
        
        socket.broadcast.emit( 'msg', me.id, me.name, msg );

        try {
            if (acknowledgementCallback) acknowledgementCallback( 'successful' )
        } catch (error) { console.log( me.id, 'acknowledgement of \'shout\' not possible' ) }
        
    } )


    
    /**
     * Path
     */
    
    socket.on( 'path', ( path ) => {
        
        ioAgent.emit( 'path', path );

    } )


    
    /**
     * Bradcast client log
     */
    if ( BROADCAST_LOGS ) {
        socket.on( 'log', ( ...message ) => {
            socket.broadcast.emit( 'log', {src: 'client', timestamp: myClock.ms, socket: socket.id, id: me.id, name: me.name}, ...message )
        } )
    }



    /**
     * GOD mod
     */
    if ( me.name == 'god' ) {

        socket.on( 'create parcel', async (x, y) => {
            console.log( 'create parcel', x, y )
            myGrid.createParcel(x, y)
        } );

        socket.on( 'dispose parcel', async (x, y) => {
            console.log( 'dispose parcel', x, y )
            let parcels = Array.from(myGrid.getParcels()).filter( p => p.x == x && p.y == y );
            for ( p of parcels)
                myGrid.deleteParcel( p.id )
            myGrid.emit( 'parcel' );
        } );

        socket.on( 'tile', async (x, y) => {
            console.log( 'create/dispose tile', x, y )
            let tile = myGrid.getTile(x, y)
            
            if ( !tile ) return;

            if ( tile.blocked ) {
                tile.delivery = false;
                tile.parcelSpawner = true;
                tile.unblock();
            } else if ( tile.parcelSpawner ) {
                tile.delivery = true;
                tile.parcelSpawner = false;
            } else if ( tile.delivery ) {
                tile.delivery = false;
                tile.parcelSpawner = false;
            } else {
                tile.delivery = false;
                tile.parcelSpawner = false;
                tile.block();
            }
        } );

    }

    socket.on( 'draw', async (bufferPng) => {
        
        // console.log( 'draw' );

        ioAgent.emit( 'draw', {
            src: 'client',
            timestamp: myClock.ms,
            socket: socket.id,
            id: me.id,
            name: me.name
        }, bufferPng );

    } );

});



/**
 * Bradcast server log
 */
if ( BROADCAST_LOGS ) {
    const oldLog = console.log;
    console.log = function ( ...message ) {
        io.emit( 'log', {src: 'server', timestamp: myClock.ms}, ...message );
        oldLog.apply( console, message );
    };
}



module.exports = io;