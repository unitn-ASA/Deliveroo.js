const Grid = require('./deliveroo/Grid');
const myClock = require('./deliveroo/Clock');



const config = require('../config');
const myGrid = new Grid( config.map );
config.parcels_generator( myGrid );



module.exports = /** @type {Grid} */ myGrid;