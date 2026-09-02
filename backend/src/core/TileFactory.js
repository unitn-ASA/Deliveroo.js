import Tile from './Tile.js';
import Xy from './Xy.js';
import SpatialRegistry from './SpatialRegistry.js';

/** @typedef {import("@unitn-asa/deliveroo-js-sdk/types/IOTile.js").IOTileType} IOTileType */


/**
 * Factory for creating Tile entities with automatic spatial registration.
 *
 * @class Factory
 * @classdesc TileFactory for creating different types of tiles
 */
class TileFactory {

    #registry;

    /**
     * Creates a new TileFactory.
     * @constructor
     * @param {SpatialRegistry<Tile>} registry - The spatial registry for tracking tiles
     */
    constructor ( registry ) {
        this.#registry = registry;
    }

    /**
     * Creates a new Tile and registers it.
     * @param {Xy} xy - The position
     * @param {IOTileType} type - The tile type
     * @returns {Tile} The created tile
     */
    create ( xy, type ) {

        const tile = new Tile( xy, type );
        this.#registry.updateSpatialIndex( tile );
        
        // Listener to update spatial index on xy changes
        tile.emitter.once( 'deleted', () => {
            // Remove from spatial registry
            this.#registry.remove( tile.id );
        } );
        
        return tile;
    }

}



export default TileFactory;
