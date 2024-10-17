const Observable =  require('./Observable')
const Xy =  require('./Xy')
const myClock =  require('./Clock')
const {PARCEL_REWARD_AVG, PARCEL_REWARD_VARIANCE, PARCEL_DECADING_INTERVAL} =  require('../../config')



class Parcel extends Xy {
    
    static #lastId = 0;
    
    // #grid;
    id;
    reward;
    carriedBy;
    
    /**
     * @constructor Parcel
     */
    constructor (x, y, carriedBy = null, reward ) {
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
        
        this.id = 'p' + Parcel.#lastId++;

        this.interceptValueSet('reward');
        this.reward = reward || Math.floor( Math.random()*PARCEL_REWARD_VARIANCE*2 + PARCEL_REWARD_AVG-PARCEL_REWARD_VARIANCE );

        const decay = () => {
            this.reward = Math.floor( this.reward - 1 );
            if ( this.reward <= 0) {
                this.emitOnePerTick( 'expired', this );
                myClock.off( PARCEL_DECADING_INTERVAL, decay );
            }
        };
        myClock.on( PARCEL_DECADING_INTERVAL, decay );
        
    }

}



module.exports = Parcel;