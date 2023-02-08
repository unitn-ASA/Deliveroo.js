const Xy =  require('./Xy')
const Parcel =  require('./Parcel')
const Grid =  require('./Grid')




/**
 * @class Tile
 */
 class Tile {
    #grid;
    #xy
    #blocked;
    #locked;
    parcels = new Set();

    /**
     * @constructor Tile
     * @param {Grid} grid
     * @param {*} x
     * @param {*} y
     */
    constructor ( grid, x, y ) {
        this.#grid = grid;
        this.#xy = new Xy(x, y);
        this.#blocked = false;
    }

    get xy() {
        return this.#xy;
    }
    
    get blocked() {
        return this.#blocked;
    }

    get locked() {
        return this.#locked;
    }

    lock() {
        this.#locked = true;
        return true;
    }

    unlock() {
        this.#locked = false;
        return false;
    }
    
}



module.exports = Tile;