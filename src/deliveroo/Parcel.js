const Observable =  require('./Observable')
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
    constructor (x, y, carriedBy = null, parcel_rewar_avg, parcel_reward_variance, parcel_decading_interval ) {
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
        this.reward = Math.floor( Math.random()*parcel_reward_variance*2 + parcel_rewar_avg-parcel_reward_variance );

        const decay = () => {
            this.reward = Math.floor( this.reward - 1 );
            if ( this.reward <= 0) {
                this.emitOnePerTick( 'expired', this );
                myClock.off( parcel_decading_interval, decay );
            }
        };
        myClock.on( parcel_decading_interval, decay );
        
    }

}



module.exports = Parcel;