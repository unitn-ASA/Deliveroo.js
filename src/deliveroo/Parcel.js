const Observable =  require('./Observable');
const Xy =  require('./Xy');
const myClock =  require('./Clock');
const Config = require('./Config');


class Parcel extends Xy {
    
    static #lastId = 0;
    
    // #grid;
    #config;
    id;
    reward;
    carriedBy;
    decay
    
    /**
     * @constructor Parcel
     * @param {number} x
     * @param {number} y
     * @param {Agent} carriedBy
     * @param {Config} options
     */
    constructor ( x, y, carriedBy = null, config ) {
        super(x, y);
        this.#config = config;
        const { PARCEL_REWARD_AVG, PARCEL_REWARD_VARIANCE, PARCEL_DECADING_INTERVAL } = config;

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
        this.reward = Math.floor( Math.random()*PARCEL_REWARD_VARIANCE*2 + PARCEL_REWARD_AVG-PARCEL_REWARD_VARIANCE );

        this.decay = () => {
            this.reward = Math.floor( this.reward - 1 );
            if ( this.reward <= 0) {
                this.emitOnePerTick( 'expired', this );
                myClock.off( PARCEL_DECADING_INTERVAL, this.decay );
            }
        };

        myClock.on( PARCEL_DECADING_INTERVAL, this.decay );
        
    }

    destroy() {
        myClock.off( this.#config.PARCEL_DECADING_INTERVAL, this.decay )
        this.removeAllListeners();          // Remove all event listeners
        this.#config = null;                // Set the reference to the Config object to null
        this.carriedBy = null;              // Set the reference to the Agent object to null

        //console.log('Parcel destroyed:', this.id); // Log a message indicating that the Parcel object has been destroyed
    }

}



module.exports = Parcel;