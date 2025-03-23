const Xy =  require('./Xy')
const Parcel =  require('./Parcel')
const Grid =  require('./Grid')
const ObservableMulti = require('../reactivity/ObservableMulti');




/**
 * @class Tile
 * @extends { ObservableMulti< {xy:Xy, type:string, locked:boolean} > }
 */
 class Tile extends ObservableMulti {

    /** @type {Xy} */
    #xy;

    /** @type {Xy} xy */
    get xy () {
        return this.#xy;
    }
    /** @type {number} */
    get x () { return this.xy.x }
    /** @type {number} */
    get y () { return this.xy.y }

    /** @type {string} */
    type;
    
    /** @type {boolean} */
    get walkable () {
        return this.type != "0";
    }

    get delivery () {
        return this.type == "2";
    }

    get parcelSpawner () {
        return this.type == "1";
    }
    
    /** @type {boolean} */
    locked;
    
    lock() {
        this.locked = true;
    }

    unlock() {
        this.locked = false;
    }
    
    // /** @type {Set<Parcel>} parcel */
    // #parcels = new Set();
    
    /**
     * @constructor Tile
     * @param {Xy} xy
     * @param {string} type
     */
    constructor ( xy, type = '1' ) {

        super();

        this.#xy = xy;

        this.watch('type', true); // immediate=true to emit agent when spawning
        this.type = type;

        this.watch('locked', true); // immediate=true to emit agent when spawning
        this.locked = false;

    }
    
}



module.exports = Tile;