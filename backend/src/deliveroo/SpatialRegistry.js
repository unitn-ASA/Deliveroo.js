import Parcel from './Parcel.js';
import Xy from './Xy.js';
import EventEmitter from 'events';



/**
 * @template {{id: string, xy: Xy, x: number, y: number}} T
 * @class SpatialRegistry
 */
class SpatialRegistry {

    /** @property {EventEmitter<{xy:[T]}>} */
    #emitter = new EventEmitter();
    get emitter () {
        return this.#emitter;
    }

    /** @type {Map<string, { spatialKey: string, item: T }>} */
    #index = new Map();

    /** @type {Map<string, T[]>} - Spatial index by spatialKey position */
    #spatialIndex = new Map();



    /**
     * @constructor
     */
    constructor ( ) {
        
        this.#emitter.setMaxListeners(0); // unlimited listeners

    }

    

    /**
     * @param {T} item
     */
    updateSpatialIndex ( item ) {

        // Use rounded xy for spatial index
        const newSpatialKey = item.xy?.rounded?.toString() || `_` ;
        
        // Retrieve stored
        let stored = this.#index.get( item.id );

        // If already stored
        if ( stored ) {
            if ( stored.spatialKey === newSpatialKey ) {
                // No position change, exit early
                return item;
            }
            // Remove from old position in spatial index
            this.removeFromSpatialIndex( stored.spatialKey, item );
        }
        // If new item
        else {
            // Create storage entry
            stored = { spatialKey: '', item: item };
            
            // Store entry
            this.#index.set( item.id, stored );
        }
        
        // Update stored spatialKey with newSpatialKey
        stored.spatialKey = newSpatialKey;
        
        // Add to new position in spatial index if valid
        if ( newSpatialKey ) {
            // If no items at this position yet, create array
            if (!this.#spatialIndex.has(newSpatialKey)) {
                this.#spatialIndex.set(newSpatialKey, []);
            }

            // Store in spatial index
            this.#spatialIndex.get(newSpatialKey).push(item);
        }

        // Emit xy update event
        this.#emitter.emit('xy', item);

        return item;
    }



    /**
     * Remove from old spatialKey in spatialIndex
     * @param {T} item 
     */
    removeFromSpatialIndex ( spatialKey, item ) {

        // Remove from old xy in spatial index
        const oldItems = this.#spatialIndex.get(spatialKey);
        if (oldItems) {
            const index = oldItems.indexOf(item);
            if (index !== -1) {
                oldItems.splice(index, 1);
                if (oldItems.length === 0) {
                    this.#spatialIndex.delete(spatialKey);
                }
            }
        }

    }



    /**
     * @type {function(string): T}
     */
    get (id) {
        return this.#index.get(id)?.item;
    }

    /**
     * @type {function(): IterableIterator<T, undefined, T>}
     */
    *getIterator () {
        for (const entry of this.#index.values()) {
            yield entry.item;
        }
    }

    /**
     * @type {function():Generator<T, void, T>}
     */
    *getByArea ( [x1,x2,y1,y2]=[0,10000,0,10000] ) {
        x1 = Math.max(0,x1)
        x2 = Math.min(this.getMaxX(),x2);
        y1 = Math.max(0,y1)
        y2 = Math.min(this.getMaxY(),y2);
        // console.log(xLength, yLength, x1, x2, y1, y2)
        for ( let x = x1; x < x2; x++ ) {
            for ( let y = y1; y < y2; y++ ) {
                var items = this.#spatialIndex.get(`${x}_${y}`);
                for ( const item of items || [] )
                    yield item;
            }
        }
    }

    /**
     * @todo to be revised!
     * @returns 
     */
    getMaxX () {
        let maxX = 0;
        for ( const {item} of this.#index.values() ) {
            if ( item.x > maxX ) maxX = item.x;
        }
        return maxX;
    }

    /**
     * @todo to be revised!
     * @returns 
     */
    getMaxY () {
        let maxY = 0;
        for ( const {item} of this.#index.values() ) {
            if ( item.y > maxY ) maxY = item.y;
        }
        return maxY;
    }

    /**
     * @type {function({x:number, y:number}): T[]}
     */
    getByXy ( xy ) {
        // Use spatial index for O(1) lookup instead of iterating all parcels
        return this.#spatialIndex.get( new Xy(xy).rounded.toString() ) || [];
    }

    /**
     * @type {function({x:number, y:number}): T}
     */
    getOneByXy ( xy ) {
        return this.getByXy( xy )[0];
    }

    /**
     * @type {function(): number}
     */
    getSize () {
        return this.#index.size;
    }

    /**
     * @type {function(String):boolean}
     */
    remove ( id ) {
        var stored = this.#index.get(id);
        if ( ! stored ) return false;

        var { spatialKey, item } = stored;

        // Remove from spatial index
        this.removeFromSpatialIndex( spatialKey, item );

        // Remove indexed item
        return this.#index.delete( id );
    }



    // /**
    //  * @type {function(): void}
    //  */
    // removeAll() {
    //     // console.log('Registry is restarting...');
    //     for ( const {item} of this.#index.values() ) {
    //         this.remove( item.id );
    //     }
    // }



}


export default SpatialRegistry;