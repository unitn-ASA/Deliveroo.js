const Xy =  require('./Xy')
const Grid =  require('./Grid')


/**
 * @class Tile
 */
 class Tile extends Xy {
    #grid;
    #blocked;   // it is a non tile, a hole
    #locked;    // flag indicating whether the card is free or already occupied
    /** @property {Set<Parcel>} parcel */
    #parcels = new Set();
    #delivery;
    #spawner;

    /**
     * @constructor Tile
     * @param {Grid} grid
     * @param {*} x
     * @param {*} y
     */
    constructor ( grid, x, y, blocked = false, delivery = false, spawner = true ) {
        
        super(x, y, 'tile');

        //Defines the graphical representation
        let color = 0x55dd55
        if(blocked) color = 0x000000
        if(delivery) color = 0xff0000
        if(spawner) color = 0x00ff00
        let style = {shape:'box', params:{width:1, height: 0.1, depth:1}, color: color } 

        this.metadata.style = style;               // save the graphical rappresentation on the metadata attribute

        this.#grid = grid;
        this.#blocked = blocked;
        this.#locked = false
        this.#delivery = delivery;
        this.#spawner = spawner;
    }
    
    get blocked() {
        return this.#blocked;
    }

    block() {
        if (this.#blocked)
            return false
        this.#blocked = true;
        this.#grid.emitOnePerTick( 'tile', this )
        return true;
    }
    unblock() {
        this.#blocked = false;
        this.#grid.emitOnePerTick( 'tile', this )
        return false;
    }

    get locked() {
        return this.#locked;
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
    
    get delivery() {
        return this.#delivery;
    }
    set delivery(value) {
        this.#delivery = value?true:false;
        this.#grid.emitOnePerTick( 'tile', this )
    }

    get spawner() {
        return this.#spawner;
    }
    set spawner(value) {
        this.#spawner = value?true:false;
        this.#grid.emitOnePerTick( 'tile', this )
    }

    getObjects(){
        return []
    }
    
    // /**
    //  * @type {function(Parcel): void}
    //  */
    // addParcel ( parcel ) {
    //     // Add on tile
    //     this.#parcels.add( parcel );
    //     // // Emit parcel added
    //     // this.emit( 'parcel added', parcel.id, this.x, this.y, parcel.reward );

    //     // On reward emit parcel reward, until not removed from this tile
    //     var rewardListener = (parcel) => {
    //         if ( this.#parcels.has(parcel) )
    //             this.emit.bind(this, 'parcel reward');
    //         else
    //             this.off( 'reward', rewardListener )
    //     }
    //     parcel.on( 'reward', rewardListener );

    //     // Once expired emit parcel expired 
    //     parcel.once( 'expired', (parcel) => {
    //         if ( this.removeParcel( parcel ) ) {
    //             this.emit( 'parcel expired', parcel );
    //         }
    //     } );
    // }

    // /**
    //  * @type {function(Parcel): boolean}
    //  */
    // removeParcel ( parcel ) {
    //     // Unregister
    //     if ( this.#parcels.delete( parcel ) ) {
    //         // Emit parcel removed
    //         this.emit( 'parcel removed', this.id, this.x, this.y );
    //     }
    //     return true;
    // }

    // /**
    //  * @type {function(): IterableIterator<Parcel>}
    //  */
    // get parcels () {
    //     return this.#parcels.values();
    // }
    
}



module.exports = Tile;