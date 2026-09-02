import Parcel from './Parcel.js';
import SpatialRegistry from './SpatialRegistry.js';
import Xy from './Xy.js';
import Agent from './Agent.js';

/**
 * Factory for creating Parcel entities with automatic spatial registration.
 *
 * @class ParcelFactory
 */
class ParcelFactory {

    #registry;

    /**
     * Creates a new ParcelFactory.
     * @constructor
     * @param {SpatialRegistry<Parcel>} registry - The spatial registry for tracking parcels
     */
    constructor ( registry ) {
        this.#registry = registry;
    }

    /**
     * Creates a new Parcel at the specified position and registers it.
     * @param {Xy} xy - The position where the parcel should be created
     * @param {Agent} [carriedBy=null] - Optional agent carrying the parcel
     * @param {number} [reward] - Optional reward value (auto-generated if not provided)
     * @returns {Parcel} The created parcel
     */
    create ( xy, carriedBy = null, reward ) {

        const parcel = new Parcel( xy, carriedBy, reward );
        this.#registry.updateSpatialIndex( parcel );
        
        // Listener to update spatial index on xy changes
        const listener = this.#registry.updateSpatialIndex.bind( this.#registry, parcel );

        // Track xy changes to update spatial index
        parcel.emitter.on( 'xy', listener );

        parcel.emitter.once( 'deleted', () => {
            // Stop tracking xy changes
            parcel.emitter.off( 'xy', listener );
            // Remove from spatial registry
            this.#registry.remove( parcel.id );
        } );
        
        return parcel;
    }

}



export default ParcelFactory;
