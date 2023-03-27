const Grid = require('../deliveroo/Grid');
const myClock =  require('../deliveroo/Clock');
const config =  require('../../config');



const PARCELS_GENERATION_INTERVAL = process.env.PARCELS_GENERATION_INTERVAL || config.PARCELS_GENERATION_INTERVAL || '2s';



/**
 * 
 * @param {Grid} grid 
 */
module.exports = function (grid) {
    
    myClock.on( PARCELS_GENERATION_INTERVAL, () => {
        let parcel;
        let trials = 0
        while ( ! parcel && trials++ < 100 ) {
            var x = Math.floor( Math.random() * (grid.getMapSize().width-2) ) + 1;
            var y = Math.floor( Math.random() * (grid.getMapSize().height-2) ) + 1;
            parcel = grid.createParcel(x, y);
        }
        // console.log('parcel created at', x, y, parcel.reward)
    } )

}
