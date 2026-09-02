import Crate from './Crate.js';
import SpatialRegistry from './SpatialRegistry.js';
import Xy from './Xy.js';

/**
 * Factory for creating Crate entities with automatic spatial registration.
 *
 * @class CrateFactory
 */
class CrateFactory {

    #registry;

    /**
     * Creates a new CrateFactory.
     * @constructor
     * @param {SpatialRegistry<Crate>} registry - The spatial registry for tracking crates
     */
    constructor ( registry ) {
        this.#registry = registry;
    }

    /**
     * Creates a new Crate at the specified position and registers it.
     * @param {Xy} xy - The position where the crate should be created
     * @returns {Crate} The created crate
     */
    create ( xy ) {

        const crate = new Crate( xy );

        // Register with spatial registry
        this.#registry.updateSpatialIndex( crate );
        
        // Listener to update spatial index on xy changes
        const listener = this.#registry.updateSpatialIndex.bind( this.#registry, crate );

        // Track xy changes to update spatial index
        crate.emitter.on( 'xy', listener );

        crate.emitter.once( 'deleted', () => {
            // Stop tracking xy changes
            crate.emitter.off( 'xy', listener );
            // Remove from spatial registry
            this.#registry.remove( crate.id );
        } );

        return crate;
    }

}



export default CrateFactory;
