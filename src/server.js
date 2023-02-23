const app = require('./app');
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server, {
    cors: {
        origin: "*", // http://localhost:3000",
        methods: ["GET", "POST"]
    }
});

const Observable =  require('./deliveroo/Observable')
const Grid = require('./deliveroo/Grid');
const Agent = require('./deliveroo/Agent');
const Xy = require('./deliveroo/Xy');
const Parcel = require('./deliveroo/Parcel');
const Tile = require('./deliveroo/Tile');
const myClock = require('./deliveroo/Clock');
const jwt = require('jsonwebtoken');



const myGrid = require('../my_game');



const Authentication = require('./deliveroo/Authentication');
const myAuthenticator = new Authentication( myGrid )



io.on('connection', (socket) => {
    


    /**
     * Authenticate socket on agent
     */
    const me = myAuthenticator.authenticate(socket);
    if ( !me ) return;
    socket.broadcast.emit( 'hi ', socket.id, me.id, me.name );

    

    /**
     * Emit map (tiles)
     */
    for (const tile of myGrid.getTiles()) {
        // console.log(tile)
        if ( !tile.blocked ) 
            socket.emit( 'tile', tile.x, tile.y, tile.delivery )
    }
    

    
    /**
     * Emit me
     */

    // Emit you
    me.on( 'agent', ({id, name, x, y, score}) => {
        // console.log( 'emit you', id, name, x, y, score );
        socket.emit( 'you', {id, name, x, y, score} );
    } );
    // console.log( 'emit you', id, name, x, y, score );
    socket.emit( 'you', {id, name, x, y, score} = me );
    


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
            acknowledgementCallback( await me[direction]() ); //.bind(me)()
        } catch (error) {  }
    });

    socket.on('pickup', async (acknowledgementCallback) => {
        try {
            acknowledgementCallback( me.pickUp() )
        } catch (error) {  }
    });

    socket.on('putdown', async (acknowledgementCallback) => {
        try {
            acknowledgementCallback( me.putDown() )
        } catch (error) {  }
                
    });



    /**
     * Comunication
     */

    socket.on( 'msg', (toId, ...args) => {
        
        // console.log( me.id, 'msg', to, ...args);
        for ( let socket of myAuthenticator.getSockets( toId ) ) {
            // console.log( me.id, 'socket', socket.id, 'emit msg', ...args );
            socket.emit( 'msg', ...args );
        }

    } )

    socket.on( 'msg broadcast', (...args) => {
        
        socket.broadcast.emit( 'msg', ...args );
        
    } )


});



module.exports = server;