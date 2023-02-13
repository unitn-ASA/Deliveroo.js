const Observable =  require('../utils/Observable')



class Parcel extends Observable {
    
    static #lastId = 0;
    
    // #grid;
    id;
    reward;
    
    /**
     * @constructor Parcel
     * @param {Grid} grid
     */
    constructor (grid) {
        super();

        // this.#grid = grid;
        this.id = Parcel.#lastId++;
        this.reward = Math.floor( Math.random()*20 + 20 );

        // Make observable
        this.interceptValueSet('reward');

        const startDecading = async () => {
            while ( this.reward > 0 ) {
                await new Promise( res => setTimeout(res, 2000) )
                this.reward = Math.floor( this.reward - 1 );
            }
            this.emitOnePerTick( 'expired', this );
            // grid.emitOnceEveryTick( 'parcel expired', this );
        }
        startDecading();

        // // Propagate events
        // this.on('reward', grid.emit.bind(grid, 'parcel reward') );
        // this.on('expired', grid.emit.bind(grid, 'parcel expired') );

    }

}



module.exports = Parcel;