const Grid = require('../src/deliveroo/Grid');
const Agent = require('../src/deliveroo/Agent');
const Parcel = require('../src/deliveroo/Parcel');
const Tile = require('../src/deliveroo/Tile');
const myClock = require('../src/deliveroo/Clock');



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
var unblocked10per10Map = [
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
]

/** @type {Grid} */
const myGrid = new Grid(myMap);



myClock.on( '2s', () => {
    let x = Math.floor(Math.random()*8) + 1;
    let y = Math.floor(Math.random()*8) + 1;
    let parcel = myGrid.createParcel(x, y);
    // if (parcel)
    //     console.log('parcel created at', x, y, parcel.reward)
} )



module.exports = myGrid;



// async function randomlyMove (agent) {
//     let previousDirection = undefined;
//     while ( true ) {
//         let direction = [ 'up', 'right', 'down', 'left' ][ Math.floor(Math.random()*4) ];
//         // console.log('randomly moving agent', direction)
//         await agent[direction]();
//         await Promise.resolve(); // if stucked do not block the program in infinite loop
//     }
// }

// var alice = myGrid.getAgent('alice');
// var bob = myGrid.getAgent('bob');
// var cloe = myGrid.getAgent('cloe');
// randomlyMove (alice)
// randomlyMove (bob)
// randomlyMove (cloe)
