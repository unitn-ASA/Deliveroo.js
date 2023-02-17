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

const Observable =  require('./utils/Observable')
const Grid = require('./deliveroo/Grid');
const Agent = require('./deliveroo/Agent');
const Xy = require('./deliveroo/Xy');
const Parcel = require('./deliveroo/Parcel');
const Tile = require('./deliveroo/Tile');
const myClock = require('./deliveroo/Clock');



var myMap = [
    [1, 1, 0, 1, 0, 1, 0, 1, 1, 1],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [1, 1, 0, 1, 0, 1, 0, 1, 0, 1],
    [1, 1, 0, 1, 0, 1, 0, 1, 0, 0],
    [1, 1, 0, 1, 0, 1, 0, 1, 1, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [1, 1, 0, 1, 1, 1, 0, 1, 1, 0],
    [1, 1, 0, 1, 0, 0, 0, 1, 1, 0],
    [1, 1, 0, 0, 0, 1, 0, 1, 1, 0]
]

const myGrid = new Grid(myMap);



// async function createRandomParcels () {
//     while ( true ) {
//         let x = Math.floor(Math.random()*10);
//         let y = Math.floor(Math.random()*10);
//         let parcel = myGrid.createParcel(x, y);
//         if (parcel)
//             console.log('parcel created at', x, y, parcel.reward)
//         await new Promise( res => setTimeout(res, 2000))
//     }
// }
// createRandomParcels ()

myClock.on( '2s', () => {
    let x = Math.floor(Math.random()*10);
    let y = Math.floor(Math.random()*10);
    let parcel = myGrid.createParcel(x, y);
    if (parcel)
        console.log('parcel created at', x, y, parcel.reward)
} )


async function randomlyMove (agent) {
    let previousDirection = undefined;
    while ( true ) {
        let direction = [ 'up', 'right', 'down', 'left' ][ Math.floor(Math.random()*4) ];
        // console.log('randomly moving agent', direction)
        await agent[direction]();
        await Promise.resolve(); // if stucked do not block the program in infinite loop
    }
}
// var alice = myGrid.getAgent('alice');
// var bob = myGrid.getAgent('bob');
// var cloe = myGrid.getAgent('cloe');
// randomlyMove (alice)
// randomlyMove (bob)
// randomlyMove (cloe)



// async function test () {
//   // myGrid.observe( (events) => {
//   //   // var i=0
//   //   for (const ev of events) {
//   //     const {name, object, subject: {id, xy } } = ev
//   //     console.log('observing Agent xy:', name, object, id, xy.toString());
//   //   }
//   // }, ev => ev.name == 'changed' && ev.object == 'xy' && ev.subject instanceof Agent );

//   // await alice.up();
//   // await alice.up();
//   // await alice.up();

//   // await bob.right();
//   // await bob.right();
//   // await bob.up();
//   // await bob.up();
//   // await bob.left();
// }
// test();




io.on('connection', (socket) => {
    // socket.broadcast.emit('hi ' + me.id);

    console.log('socket', socket.id + ' connected', socket.handshake.url);
    // console.log('socket', socket.id + ' connected', socket.handshake.headers.referer);
    
    let id = socket.handshake.query.id
    let name = socket.handshake.query.name
    let password = socket.handshake.query.password
    
    var me = myGrid.getAgent( id )
    if ( me && me.password == password ) {
        if ( name ) 
            me.name = name;
    }
    else
        me = myGrid.createAgent( name, password );
    

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
        // console.log('yourposition:', id, x, y);
        socket.emit( 'you', {id, name, x, y, score} );
    } );
    // console.log('you', me.id, me.x, me.y, me.score, me.carrying );
    socket.emit( 'you', {id, name, x, y, score} = me );
    


    /**
     * Emit sensing
     */

    // Parcels
    me.on( 'parcels sensing', (parcels) => {
        // console.log('server.js', 'parcels sensing', ...parcels);
        socket.emit('parcels sensing', parcels )
    } );
    me.emitParcelSensing();

    // Agents
    me.on( 'agents sensing', (id, x, y, score, carrying) => {
        // console.log('server.js', 'sensing agent', id, x, y, score);
        socket.emit( 'agents sensing', id, x, y, score, carrying );
    } );
    me.emitAgentSensing();
    


    /**
     * Actions
     */
    
    socket.on('move', async (direction, acknowledgementCallback) => {
        // console.log(me.id, me.x, me.y, direction);
        acknowledgementCallback( await me[direction]() ); //.bind(me)()
    });

    socket.on('pickup', async (acknowledgementCallback) => {
        acknowledgementCallback( me.pickUp() )
    });

    socket.on('putdown', async (acknowledgementCallback) => {
        acknowledgementCallback( me.putDown() )
    });
    


    /**
     * on Disconnect
     */
    socket.on('disconnect', () => {
        console.log('socket ' + socket.id + ' (' + me.id + ') ' + 'disconnected');
        // myGrid.deleteAgent ( me );
        // me.removeAllListeners('xy');
        // me.removeAllListeners('sensing agents');
        // me.removeAllListeners('agent');
    });

});



module.exports = server;