const Xy =  require('./Xy')
const Parcel =  require('./Parcel')
const Grid =  require('./Grid')




/**
 * @class Tile
 */
 class Tile extends Xy {
    #grid;
    #blocked;
    #locked;
    /** @property {Set<Parcel>} parcel */
    #parcels = new Set();
    #delivery;

    /**
     * @constructor Tile
     * @param {Grid} grid
     * @param {*} x
     * @param {*} y
     */
    constructor ( grid, x, y, blocked = false, delivery = false) {
        super(x, y);
        this.#grid = grid;
        this.#blocked = blocked;
        this.#delivery = delivery;
    }
    
    get blocked() {
        return this.#blocked;
    }

    get locked() {
        return this.#locked;
    }
    
    get delivery() {
        return this.#delivery;
    }

    /**
     * 
     * @returns true if previously unlocked, false if already locked
     */
    lock() {
        if (this.#locked)
            return false
        this.#locked = true;
        this.emitOnePerTick( 'tile', this )
        return true;
    }

    unlock() {
        this.#locked = false;
        this.emitOnePerTick( 'tile', this )
        return false;
    }

    /**
     * @type {function(Parcel): void}
     */
    addParcel ( parcel ) {
        // Add on tile
        this.#parcels.add( parcel );
        // // Emit parcel added
        // this.emit( 'parcel added', parcel.id, this.x, this.y, parcel.reward );

        // On reward emit parcel reward, until not removed from this tile
        var rewardListener = (parcel) => {
            if ( this.#parcels.has(parcel) )
                this.emit.bind(this, 'parcel reward');
            else
                this.off( 'reward', rewardListener )
        }
        parcel.on( 'reward', rewardListener );

        // Once expired emit parcel expired 
        parcel.once( 'expired', (parcel) => {
            if ( this.removeParcel( parcel ) ) {
                this.emit( 'parcel expired', parcel );
            }
        } );
    }

    /**
     * @type {function(Parcel): boolean}
     */
    removeParcel ( parcel ) {
        // Unregister
        if ( this.#parcels.delete( parcel ) ) {
            // Emit parcel removed
            this.emit( 'parcel removed', this.id, this.x, this.y );
        }
        return true;
    }

    /**
     * @type {function(): IterableIterator<Parcel>}
     */
    get parcels () {
        return this.#parcels.values();
    }
    
}



module.exports = Tile;