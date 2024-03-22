const Grid = require('../deliveroo/Grid');
const myClock =  require('../deliveroo/Clock');
/**
 * @typedef {import('../deliveroo/Config')} Config
 */



/**
 * @param {Config} config
 * @param {Grid} grid 
 */
class ParcelsGenerator {

    /** @type {Config} */
    #config;

    /** @type {Grid} */
    #grid;

    constructor( config, grid ) {

        this.#config = config;
        this.#grid = grid;   

        myClock.on( config.PARCELS_GENERATION_INTERVAL, this.listener );
    }

    async destroy () {
        myClock.off( this.#config.PARCELS_GENERATION_INTERVAL, this.listener );
    }


    listener = () =>  {

        const PARCELS_MAX = this.#config.PARCELS_MAX;
        const grid = this.#grid;

        if ( grid.getParcelsQuantity() >= PARCELS_MAX ) {
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
            let parcel = grid.createParcel( tile.x, tile.y );
        }
        
    }


}

module.exports = ParcelsGenerator;