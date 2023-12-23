const Grid = require('../deliveroo/Grid');
const Tile =  require('../deliveroo/Tile');
const myClock =  require('../deliveroo/Clock');
const config =  require('../../config');


//const PARCELS_MAX = process.env.PARCELS_MAX || config.PARCELS_MAX || 'infinite';



/**
 * 
 * @param {Grid} grid 
 */
module.exports = function (grid, parcels_generation_interval, parcels_max, parcel_rewar_avg, parcel_reward_variance, parcel_decading_interval) {
    
    myClock.on( parcels_generation_interval, () => {
        if ( grid.getParcelsQuantity() >= parcels_max ) {
            return;
        }
        let tiles_with_no_parcels =
            Array.from( grid.getTiles() )
            // // not a delivery tile
            // .filter( t => ! t.delivery )
            // parcel spawner tile
            .filter( t => t.parcelSpawner )
            // no parcels exists on the tile
            .filter( t =>
                Array.from( grid.getParcels() )
                .find( p =>
                    p.x == t.x && p.y == t.y
                ) == undefined
            )
        if ( tiles_with_no_parcels.length > 0 ) {
            let i = Math.floor( Math.random() * tiles_with_no_parcels.length - 1 )
            let tile = tiles_with_no_parcels.at( i )
            let parcel = grid.createParcel( tile.x, tile.y,parcel_rewar_avg, parcel_reward_variance, parcel_decading_interval );
        }
        
    } )

}
