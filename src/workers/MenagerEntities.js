const Grid = require('../deliveroo/Grid');
const Tile =  require('../deliveroo/Tile');
const Parcel = require('../deliveroo/Parcel')
const myClock =  require('../deliveroo/Clock');
const config =  require('../../config');



const PARCELS_GENERATION_INTERVAL = process.env.PARCELS_GENERATION_INTERVAL || config.PARCELS_GENERATION_INTERVAL || '2s';
const PARCELS_MAX = process.env.PARCELS_MAX || config.PARCELS_MAX || 'infinite';



/**
 * 
 * @param {Grid} grid 
 */
module.exports = function (grid) {
    
    myClock.on( PARCELS_GENERATION_INTERVAL, () => {
        if ( grid.getEntitiesQuantity() >= PARCELS_MAX ) {
            return;
        }
        let tiles_with_no_parcels =
            Array.from( grid.getTiles() )
            // parcel spawner tile
            .filter( t => t.parcelSpawner )
            // no parcels exists on the tile
            .filter( t =>
                Array.from( grid.getEntities() )
                .find( p =>
                    p.x == t.x && p.y == t.y
                ) == undefined
            )
        if ( tiles_with_no_parcels.length > 0 ) {
            let i = Math.floor( Math.random() * tiles_with_no_parcels.length - 1 )
            let tile = tiles_with_no_parcels.at( i )

            let parcel = new Parcel( tile.x, tile.y );
            parcel = grid.createEntity( tile.x, tile.y, parcel );
        }
        
    } )

}