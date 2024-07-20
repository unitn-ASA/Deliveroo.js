const { Server } = require('socket.io');
const myGrid = require('./grid');
const config = require('../config');
const myClock = require('./deliveroo/Clock');
require('events').EventEmitter.defaultMaxListeners = 200; // default is only 10! (https://nodejs.org/api/events.html#eventsdefaultmaxlisteners)

const BROADCAST_LOGS = process.env.BROADCAST_LOGS ?? config.BROADCAST_LOGS ?? false;


const io = new Server( {
    cors: {
        origin: "*", // http://localhost:3000",
        methods: ["GET", "POST"]
    }
} );



io.on('connection', (socket) => {
    
    /**
     * Authenticate socket on agent
     */
    const me = myGrid.menagerAgents.authenticate(socket);
    if ( !me ) return;
    const controller = myGrid.menagerControllers.getController(me)
    socket.broadcast.emit( 'hi ', socket.id, me.id, me.name );



    /**
     * Config
     */
    /*if ( me.name == 'god' ) { // 'god' mod
        me.config.PARCELS_OBSERVATION_DISTANCE = 'infinite'
        me.config.AGENTS_OBSERVATION_DISTANCE = 'infinite'
    }*/
    socket.emit( 'config', me.config )

    

    /**
     * Emit map (tiles)
     */
    myGrid.on( 'tile', ({x, y, type, metadata, delivery, blocked, spawner}) => {
        //console.log( 'emit tile', x, y, type, metadata, delivery, parcelSpawner );
        if (!blocked)
            socket.emit( 'tile', x, y, type, metadata, delivery, spawner );
        else
            socket.emit( 'not_tile', x, y, type, metadata );
    } );
    let tiles = []
    for (const {x, y, type, metadata, delivery, blocked, spawner} of myGrid.getTiles()) {
        //console.log( 'emit tile', x, y, type, metadata, delivery, parcelSpawner );
        if ( !blocked ) {
            socket.emit( 'tile', x, y, type, metadata, delivery, spawner )
            tiles.push( {x, y, type, metadata, delivery, spawner} )
        } else
            socket.emit( 'not_tile', x, y, type, metadata );
    }
    let {width, height} = myGrid.getMapSize()
    socket.emit( 'map', width, height, tiles )
    

    
    /**
     * Emit me
     */
    // Emit you
    me.on( 'update', ({id, x, y, type, metadata}) => {
        //console.log( 'emit you', id, x, y, type, metadata );
        socket.emit( 'you', {id, x, y, type, metadata} );
    } );
    // console.log( 'emit you', id, name, x, y, score );
    socket.emit( 'you', me );
    

    /**
     * Emit sensing
     */
    // Entities
    me.on( 'entities sensing', (entities) => {
        //console.log('emit entities sensing', ...entities);
        socket.emit('entities sensing', entities )
    } );
    me.emitEntitySensing();

    // Agents
    me.on( 'agents sensing', (agents) => {
        // console.log(me.get('name') + ' emit agents sensing', ...agents); // {id, x, y, type, metadata}
        socket.emit( 'agents sensing', agents );
    } );
    me.emitAgentSensing();
    

    /**
     * Actions
     */
    socket.on('up', async (acknowledgementCallback) => {
        try {
            const action = await controller.up();
            if ( acknowledgementCallback )
                acknowledgementCallback( await action ); 
        } catch (error) { 
            //console.error(error) 
        }
    });

    socket.on('down', async (acknowledgementCallback) => {
        try {
            const action = await controller.down();
            if ( acknowledgementCallback )
                acknowledgementCallback( await action ); 
        } catch (error) { 
            //console.error(error) 
        }
    });

    socket.on('left', async (acknowledgementCallback) => {
        try {
            const action = await controller.left();
            if ( acknowledgementCallback )
                acknowledgementCallback( await action ); 
        } catch (error) { 
            //console.error(error) 
        }
    });

    socket.on('right', async (acknowledgementCallback) => {
        try {
            const action = await controller.right();
            if ( acknowledgementCallback )
                acknowledgementCallback( await action ); 
        } catch (error) { 
            //console.error(error) 
        }
    });

    socket.on('jump', async (acknowledgementCallback) => {
        try {
            const action = await controller.jump();
            if ( acknowledgementCallback )
                acknowledgementCallback( await action ); 
        } catch (error) { 
            //console.error(error) 
        }
    });

    socket.on('pickup', async (acknowledgementCallback) => {
        try {
            const action = await controller.pickUp()
            if ( acknowledgementCallback )
                acknowledgementCallback( await action ); 
        } catch (error) { 
            //console.error(error) 
        }
    });

    socket.on('putdown', async (acknowledgementCallback) => {
        try {
            const action = await controller.putDown()
            if ( acknowledgementCallback )
                acknowledgementCallback( await action ); 
        } catch (error) { 
            //console.error(error) 
        }
    });

    socket.on('shift-up', async (acknowledgementCallback) => {
        try {
            const action = await controller.shiftUp();
            if ( acknowledgementCallback )
                acknowledgementCallback( await action ); 
        } catch (error) { 
            //console.error(error) 
        }
    });

    socket.on('shift-down', async (acknowledgementCallback) => {
        try {
            const action = controller.shiftDown();
            if ( acknowledgementCallback )
                acknowledgementCallback( await action ); 
        } catch (error) { 
            //console.error(error) 
        }
    });

    socket.on('shift-left', async (acknowledgementCallback) => {
        try {
            const action = controller.shiftLeft();
            if ( acknowledgementCallback )
                acknowledgementCallback( await action ); 
        } catch (error) { 
            //console.error(error) 
        }
    });

    socket.on('shift-right', async (acknowledgementCallback) => {
        try {
            const action = controller.shiftRight();
            if ( acknowledgementCallback )
                acknowledgementCallback( await action ); 
        } catch (error) { 
            //console.error(error) 
        }
    });

    socket.on('shift-jump', async (acknowledgementCallback) => {
        try {
            const action = controller.shiftJump();
            if ( acknowledgementCallback )
                acknowledgementCallback( await action ); 
        } catch (error) { 
            //console.error(error) 
        }
    });

    socket.on('shift-pickup', async (acknowledgementCallback) => {
        try {
            const action = await controller.shiftPickUp()
            if ( acknowledgementCallback )
                acknowledgementCallback( await action ); 
        } catch (error) { 
            //console.error(error) 
        }
    });

    socket.on('shift-putdown', async (acknowledgementCallback) => {
        try {
            const action = await controller.shiftPutDown()
            if ( acknowledgementCallback )
                acknowledgementCallback( await action ); 
        } catch (error) { 
            //console.error(error) 
        }
    });

    socket.on( 'click', async (x, y, acknowledgementCallback) => {
        try {
            const action = await controller.controller.click(x,y)
            if ( acknowledgementCallback )
                acknowledgementCallback( await action ); 
        } catch (error) { 
            //console.error(error) 
        }
    });

    socket.on( 'shift-click', async (x, y, acknowledgementCallback) => {
        try {
            const action = await controller.shiftClick(x,y)
            if ( acknowledgementCallback )
                acknowledgementCallback( await action ); 
        } catch (error) { 
            //console.error(error) 
        }
    });



    /**
     * Communication
     */

    socket.on( 'say', (toId, msg, acknowledgementCallback) => {
        
        // console.log( me.id, me.name, 'say ', toId, msg );

        for ( let socket of myAuthenticator.getSockets( toId )() ) {
            
            // console.log( me.id, me.name, 'emit \'msg\' on socket', socket.id, msg );
            socket.emit( 'msg', me.id, me.name, msg );

        }

        try {
            if (acknowledgementCallback) acknowledgementCallback( 'successful' )
        } catch (error) { console.log( me.id, 'acknowledgement of \'say\' not possible' ) }

    } )

    socket.on( 'ask', (toId, msg, replyCallback) => {
        // console.log( me.id, me.name, 'ask', toId, msg );

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
        
        for ( let s of myAuthenticator.getSockets( me.id )() ) {

            if ( s == socket )
                continue;
            
            s.emit( 'path', path );

        }

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
    */

    socket.on( 'draw', async (bufferPng) => {
        // console.log( 'draw' );
        for ( let s of myAuthenticator.getSockets( me.id )() ) {
            if ( s == socket )
                continue;
            s.emit( 'draw', {src: 'client', timestamp: myClock.ms, socket: socket.id, id: me.id, name: me.name}, bufferPng );
        }
        // socket.broadcast.emit( 'draw', {src: 'client', timestamp: myClock.ms, socket: socket.id, id: me.id, name: me.name}, bufferPng );
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