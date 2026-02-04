import myClock from '../myClock.js';
import { config } from '../config/config.js';
import Grid from '../deliveroo/Grid.js';


/**
 * 
 * @param {Spawner} Spawner 
 */
class Spawner {

    /** @type {Grid} */
    #grid;
    
    constructor ( grid ) {
        
        this.#grid = grid;
        myClock.once( config.GAME.parcels.generation_event, this.recurrent.bind(this) );
        
    }

    recurrent () {
        this.spawn();
        myClock.once( config.GAME.parcels.generation_event, this.recurrent.bind(this) );
    }

    spawn () {
        const grid = this.#grid;
        if ( grid.parcelRegistry.getSize() >= config.GAME.parcels.max ) {
            return;
        }
        let tiles_with_no_parcels = this.tilesWithNoParcels();
        if ( tiles_with_no_parcels.length > 0 ) {
            let i = Math.floor( Math.random() * tiles_with_no_parcels.length );
            let tile = tiles_with_no_parcels.at( i );
            if (tile && tile.xy) {
                grid.createParcel( tile.xy );
            }
        }
    }

    tilesWithNoParcels () {
        const grid = this.#grid;
        let tiles_with_no_parcels = Array.from( grid.tileRegistry.getIterator() )
        // parcel spawner tile
        .filter( t => t.parcelSpawner )
        // no parcels exists on the tile
        .filter( t =>
            Array.from( grid.parcelRegistry.getIterator() ).find( p =>
                p.x == t.x && p.y == t.y
            ) == undefined
        )
        return tiles_with_no_parcels;
    }

}
        
export default Spawner;
