const Observable =  require('../utils/Observable')
const myClock =  require('./Clock')



class Parcel extends Observable {
    
    static #lastId = 0;
    
    // #grid;
    id;
    reward;
    carriedBy;
    
    /**
     * @constructor Parcel
     * @param {Grid} grid
     */
    constructor (grid) {
        super();

        // Make observable
        this.interceptValueSet('reward');
        this.interceptValueSet('carriedBy');

        // this.#grid = grid;
        this.id = Parcel.#lastId++;
        this.reward = Math.floor( Math.random()*20 + 20 );

        const decay = () => {
            this.reward = Math.floor( this.reward - 5 );
            if ( this.reward <= 0) {
                this.emitOnePerTick( 'expired', this );
                myClock.off( '5s', decay );
            }
        };
        myClock.on( '5s', decay );

        // const startDecading = async () => {
        //     while ( this.reward > 0 ) {
        //         await new Promise( res => setTimeout(res, 2000) )
        //         this.reward = Math.floor( this.reward - 1 );
        //     }
        //     this.emitOnePerTick( 'expired', this );
        //     // grid.emitOnceEveryTick( 'parcel expired', this );
        // }
        // startDecading();
    }

}



module.exports = Parcel;