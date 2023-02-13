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



async function createRandomParcels () {
    while ( true ) {
        let x = Math.floor(Math.random()*10);
        let y = Math.floor(Math.random()*10);
        let parcel = myGrid.createParcel(x, y);
        if (parcel)
            console.log('parcel created at', x, y, parcel.reward)
        await new Promise( res => setTimeout(res, 2000))
    }
}
createRandomParcels ()



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
    console.log('user', socket.id + ' connected');

    var me = myGrid.getAgent(socket.id);
    // console.log('you', me.id, me.x, me.y);
    socket.emit('you', me);
    // socket.broadcast.emit('hi ' + me.id);

    /**
     * Emit tiles
     */
    for (const tile of myGrid.getTiles()) {
        // console.log(tile)
        if ( !tile.blocked ) 
            socket.emit('tile', tile.x, tile.y, tile.delivery)
    }
    


    /**
     * Emit parcel events
     */
    // myGrid.on( 'parcel added', (id, x, y, reward) => {
    //     socket.emit('parcel added', id, x, y, reward)
    // } );
    // myGrid.on( 'parcel removed', (id) => {
    //     socket.emit('parcel removed', id )
    // } );
    // myGrid.on( 'parcel reward', (parcel) => {
    //     socket.emit('parcel reward', parcel )
    // } );
    me.on( 'parcel sensing', (parcels) => {
        socket.emit('parcel sensing', parcels )
    } );
    

    
    /**
     * Emit agent events
     */

    // Emit you
    me.on( 'agent', ({id, x, y, score}) => {
        // console.log('yourposition:', id, x, y);
        socket.emit( 'you', {id, x, y, score} )
    } );
    socket.emit( 'you', {id, x, y, score} = me )
    
    // // Emit my initial sensing
    // for (const {id, x, y, score} of me.sensing) {
    //     // console.log(me.id, 'emit', 'sensing agent', {id, x, y});
    //     socket.emit( 'sensing agent', id, x, y, score )
    // }

    // Emit sensing events
    me.on( 'sensing agent', (id, x, y, score) => {
        // console.log('server.js', 'sensing agent', id, x, y, score);
        socket.emit( 'sensing agent', id, x, y, score );
    } );

    // Trigger initial sensing
    me.evaluateSensing( me );
    
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
     * Disconnect
     */
    socket.on('disconnect', () => {
        console.log('user ' + me.id + ' disconnected');
        myGrid.deleteAgent ( me );
        // me.removeAllListeners('xy');
        me.removeAllListeners('sensing agent');
    });

});



module.exports = server;