const Xy =  require('./Xy')
const Grid =  require('./Grid')

/**
 * @class Tile
 */
 class Tile extends Xy {

    grid;
    #locked;    // flag indicating whether the card is free or already occupied

    /**
     * @constructor Tile
     * @param {Grid} grid
     * @param {*} x
     * @param {*} y
     */
    constructor(grid, x, y, type = 'tile') {
        super(x, y, type);
        this.grid = grid;
        this.#locked = false;
        
        const style = { shape: 'box', params: { width: 1, height: 0.1, depth: 1 }, color: 0x55dd55 };
        this.metadata.style = style;
    }

    get(property){
        return  this.metadata[property]
    }
    
    set(property, value){
        //console.log('SET ', property , value)
        this.metadata[property] = value
        //emit only one time at the end of the frame the update event
        this.grid.postponeAtNextFrame( this.grid.emit.bind(this.grid) )('tile', this)
    }
    
    
    get locked() {
        return this.#locked;
    }

    lock() {
        this.#locked = true;
        this.emitOnePerFrame('locked')
        return true;
    }

    unlock() {
        this.#locked = false;
        this.emitOnePerFrame('unlocked')
        return true;
    }
            
}



module.exports = Tile;