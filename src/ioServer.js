const { Server } = require('socket.io');
const ListaGames = require('./deliveroo/ListGames')
const AuthenticationUnique = require('./deliveroo/AuthenticationUnique');
const config = require('../config');
const myClock = require('./deliveroo/Clock');

const myAuthenticatorUnique = new AuthenticationUnique; 
const myListaGames = new ListaGames;

const io = new Server( {
    cors: {
        origin: "*", // http://localhost:3000",
        methods: ["GET", "POST"]
    }
} );

io.on('connection', (socket) => {
    
    console.log("Connessione ", socket + " al game ", socket.handshake.headers['game'] )
    var game = socket.handshake.headers['game'];
    const me = myAuthenticatorUnique.authenticate(myListaGames.lista[game], socket)
    
    if ( !me ) return;
    socket.broadcast.emit( 'hi ', socket.id, me.id, me.name );


    /**
     * Config
     */
    if ( me.name == 'god' ) { // 'god' mod
        me.config.PARCELS_OBSERVATION_DISTANCE = 'infinite'
        me.config.AGENTS_OBSERVATION_DISTANCE = 'infinite'
    }
    socket.emit( 'config', me.config )


    /**
     * Game Join
    */
    myListaGames.join(game, socket, me)
    console.log('Socket entrata nel game:', game)

      
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
        
        console.log( me.id, me.name, 'say ', toId, msg );

        for ( let socket of myAuthenticator.getSockets( toId )() ) {
            
            // console.log( me.id, me.name, 'emit \'msg\' on socket', socket.id, msg );
            socket.emit( 'msg', me.id, me.name, msg );

        }

        try {
            if (acknowledgementCallback) acknowledgementCallback( 'successful' )
        } catch (error) { console.log( me.id, 'acknowledgement of \'say\' not possible' ) }

    } )

    socket.on( 'ask', (toId, msg, replyCallback) => {
        console.log( me.id, me.name, 'ask', toId, msg );

        for ( let socket of myAuthenticator.getSockets( toId )() ) {
            
            // console.log( me.id, 'socket', socket.id, 'emit msg', ...args );
            socket.emit( 'msg', me.id, me.name, msg, (reply) => {

                try {
                    console.log( toId, 'replied', reply );
                    replyCallback( reply )
                } catch (error) { console.log( me.id, 'error while trying to acknowledge reply' ) }

            } );

        }

    } )

    socket.on( 'shout', (msg, acknowledgementCallback) => {

        console.log( me.id, me.name, 'shout', msg );

        socket.broadcast.emit( 'msg', me.id, me.name, msg );

        try {
            if (acknowledgementCallback) acknowledgementCallback( 'successful' )
        } catch (error) { console.log( me.id, 'acknowledgement of \'shout\' not possible' ) }
        
    } )


    
    /**
     * Path
     */
    
    socket.on( 'path', ( path ) => {
        
        for ( let s of myAuthenticator.getSockets( me.id )() ) {

            if ( s == socket )
                continue;
            
            s.emit( 'path', path );

        }

    } )


    
    /**
     * Bradcast client log
     */
    socket.on( 'log', ( ...message ) => {
        socket.broadcast.emit( 'log', {src: 'client', timestamp: myClock.ms, socket: socket.id, id: me.id, name: me.name}, ...message )
    } )




});



/**
 * Bradcast server log
 */
const oldLog = console.log;
console.log = function ( ...message ) {
    io.emit( 'log', {src: 'server', timestamp: myClock.ms}, ...message );
    oldLog.apply( console, message );
};



module.exports = io;