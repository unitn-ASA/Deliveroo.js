const myClock = require('../myClock');
const config = require('../../config');
const Grid = require('./Grid');


/**
 * 
 * @param {Spawner} Spawner 
 */
class Spawner {

    /** @type {Grid} */
    #grid;
    
    constructor ( grid ) {
        
        this.#grid = grid;
        myClock.once( config.PARCELS_GENERATION_INTERVAL, this.recurrent.bind(this) );
        
    }

    recurrent () {
        this.spawn();
        myClock.once( config.PARCELS_GENERATION_INTERVAL, this.recurrent.bind(this) );
    }

    spawn () {
        const grid = this.#grid;
        if ( grid.getParcelsQuantity() >= config.PARCELS_MAX ) {
            return;
        }
        let tiles_with_no_parcels = this.tilesWithNoParcels();
        if ( tiles_with_no_parcels.length > 0 ) {
            let i = Math.floor( Math.random() * tiles_with_no_parcels.length - 1 )
            let tile = tiles_with_no_parcels.at( i )
            let parcel = grid.createParcel( tile.xy );
        }
    }

    tilesWithNoParcels () {
        const grid = this.#grid;
        let tiles_with_no_parcels = Array.from( grid.getTiles() )
        // parcel spawner tile
        .filter( t => t.parcelSpawner )
        // no parcels exists on the tile
        .filter( t =>
            Array.from( grid.getParcels() ).find( p =>
                p.x == t.x && p.y == t.y
            ) == undefined
        )
        return tiles_with_no_parcels;
    }

}
        
module.exports = Spawner;
