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

    /** @type {Map<string, Map<string, T>>} - Spatial index: spatialKey → (id → item) */
    #spatialIndex = new Map();

    /** Cached maximum x coordinate */
    #maxX = 0;
    getMaxX () { return this.#maxX; }

    /** Cached maximum y coordinate */
    #maxY = 0;
    getMaxY () { return this.#maxY; }

    /** @type {function():Xy} */
    getMaxXy () {
        return new Xy({ x: this.#maxX, y: this.#maxY });
    }


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
            this.removeFromSpatialIndex( stored );
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

        // Add to new position in spatial index
        if (!this.#spatialIndex.has(newSpatialKey)) {
            this.#spatialIndex.set(newSpatialKey, new Map());
        }
        this.#spatialIndex.get(newSpatialKey).set(item.id, item);

        // Update cached max values
        if (item.x > this.#maxX) this.#maxX = item.x;
        if (item.y > this.#maxY) this.#maxY = item.y;

        // Emit xy update event
        this.#emitter.emit('xy', item);

        return item;
    }



    /**
     * Remove from old spatialKey in spatialIndex
     * @param {{ spatialKey: string, item: T }} stored
     */
    removeFromSpatialIndex ( stored ) {
        const { spatialKey, item } = stored;

        const innerMap = this.#spatialIndex.get(spatialKey);
        if (innerMap) {
            innerMap.delete(item.id);
            if (innerMap.size === 0) {
                this.#spatialIndex.delete(spatialKey);
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
     * @type {function({x: number, y: number}, {x: number, y: number}):Generator<T, void, T>}
     */
    *getByArea ( {x: x1, y: y1} = {x: 0, y:0}, {x: x2, y: y2} = {x: 10000, y: 10000} ) {
        x1 = Math.max(0,x1)
        x2 = Math.min(this.getMaxX(),x2);
        y1 = Math.max(0,y1)
        y2 = Math.min(this.getMaxY(),y2);
        // console.log(xLength, yLength, x1, x2, y1, y2)
        for ( let x = x1; x < x2; x++ ) {
            for ( let y = y1; y < y2; y++ ) {
                const innerMap = this.#spatialIndex.get(`${x}_${y}`);
                if ( innerMap ) {
                    for ( const item of innerMap.values() )
                        yield item;
                }
            }
        }
    }

    /**
     * Use spatial index for O(1) lookup instead of iterating all parcels
     * @type {function( Xy | {x:number, y:number} ): T[]}
     */
    getByXy ( xy ) {
        // @ts-ignore
        const spatialKey = xy?.rounded?.toString() || new Xy(xy).rounded.toString();
        const innerMap = this.#spatialIndex.get( spatialKey );
        return innerMap ? Array.from(innerMap.values()) : [];
    }

    /**
     * @type {function( Xy | {x:number, y:number} ): T}
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

    /** Recompute cached max bounds - only called when removing boundary items */
    #recomputeMaxBounds () {
        this.#maxX = 0;
        this.#maxY = 0;
        for ( const {item} of this.#index.values() ) {
            if ( item.x > this.#maxX ) this.#maxX = item.x;
            if ( item.y > this.#maxY ) this.#maxY = item.y;
        }
    }

    /**
     * @type {function(String):boolean}
     */
    remove ( id ) {
        const stored = this.#index.get(id);
        if ( ! stored ) return false;

        const { item } = stored;

        // Check if removed item is at boundary - recompute if needed
        if (item.x >= this.#maxX || item.y >= this.#maxY) {
            this.#recomputeMaxBounds();
        }

        // Remove from spatial index
        this.removeFromSpatialIndex( stored );

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