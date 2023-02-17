const Observable =  require('../utils/Observable')
const Xy =  require('./Xy')
const myClock =  require('./Clock')



class Parcel extends Xy {
    
    static #lastId = 0;
    
    // #grid;
    id;
    reward;
    carriedBy;
    
    /**
     * @constructor Parcel
     */
    constructor (x, y, carriedBy = null ) {
        super(x, y);

        this.carriedBy = carriedBy;
        this.interceptValueSet('carriedBy');

        // Follow carrier
        var lastCarrier = null;
        const followCarrier = (agent) => {
            this.x = agent.x;
            this.y = agent.y;
        }
        this.on( 'carriedBy', (parcel) => {
            if ( lastCarrier )
                lastCarrier.off( 'xy', followCarrier )
            if ( this.carriedBy )
                this.carriedBy.on( 'xy', followCarrier )
            lastCarrier = this.carriedBy;
        } )
        
        this.id = Parcel.#lastId++;

        this.interceptValueSet('reward');
        this.reward = Math.floor( Math.random()*20 + 20 );

        const decay = () => {
            this.reward = Math.floor( this.reward - 1 );
            if ( this.reward <= 0) {
                this.emitOnePerTick( 'expired', this );
                myClock.off( '1s', decay );
            }
        };
        myClock.on( '1s', decay );
    }

}



module.exports = Parcel;