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



const myGrid = new Grid();



async function createRandomParcels () {
  while ( true ) {
    let x = Math.floor(Math.random()*10);
    let y = Math.floor(Math.random()*10);
    myGrid.createParcel( new Xy(x,y) );
    await new Promise( res => setTimeout(res, 5000))
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
var alice = myGrid.getAgent('alice');
var bob = myGrid.getAgent('bob');
// var cloe = myGrid.getAgent('cloe');
randomlyMove (alice)
randomlyMove (bob)



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
  socket.emit('you', me.id);
  // socket.broadcast.emit('hi ' + me.id);



  /**
   * Emit parcel events
   */
  myGrid.observe( (events) => {
    for (const ev of events) {
      let parcel = ev.object
      let {id, reward} = parcel
      let tile = ev.subject
      let {xy: {x, y}} = tile
      socket.emit('add parcel', {id, reward, x, y} )
    }
  }, ev => ev.name == 'add parcel' && ev.object instanceof Parcel && ev.subject instanceof Tile );

  myGrid.observe( (events) => {
    for (const ev of events) {
      let parcel = ev.subject
      socket.emit('parcel reward', parcel )
    }
  }, ev => ev.name == 'changed' && ev.object == 'reward' && ev.subject instanceof Parcel );
  

  
  /**
   * Emit agent events
   */

  // Emit my movements
  const toUnsubscribe = me.observe( (events) => {
    for (const ev of events) {
      const {name, object, subject: {id, xy: {x, y} } } = ev;
      // console.log('observing Agent xy:', name, object, id, xy.toString());
      socket.emit('yourposition', {id: id, x: x, y: y})
    }
  }, ev => ev.name == 'changed' && ev.object == 'xy' && ev.subject instanceof Agent );

  // Emit my initial sensing
  for (const s of me.sensing) {
    const {id, xy: {x, y} } = s;
    // console.log(me.id, 'emit', 'sensing agent', {id, x, y});
    socket.emit('sensing agent', {id, x, y})
  }
  
  // Emit sensing events
  const toUnsubscribe2 = me.observe( (events) => {
    for (const ev of events) {
      const {name, object: {id, xy: {x, y} }, subject: me} = ev;
      // console.log(me.id, 'emit', ev.name, {who, x, y});
      socket.emit(ev.name, {id, x, y})
    }
  }, ev => ['start sensing agent', 'sensing agent', 'no more sensing agent'].includes(ev.name) );

  socket.on('move', async (direction, acknowledgementCallback) => {
    console.log(me.id, direction);
    acknowledgementCallback( await me[direction]() ); //.bind(me)()
  });

  socket.on('pickup', async (parcelId, acknowledgementCallback) => {
    acknowledgementCallback( me.pickUp( myGrid.getParcel(parcelId) ) )
  });

  socket.on('putdown', async (parcelId, acknowledgementCallback) => {
    me.putdown( myGrid.getParcel(parcelId) )
  });
  


  /**
   * Disconnect
   */
  socket.on('disconnect', () => {
    console.log('user ' + me.id + ' disconnected');
    myGrid.deleteAgent ( me.id );
    me.unobserve(toUnsubscribe);
    me.unobserve(toUnsubscribe2);
  });

});



module.exports = server;