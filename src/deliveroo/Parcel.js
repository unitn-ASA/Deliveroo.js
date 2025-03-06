const ObservableValue =  require('../reactivity/ObservableValue')
const Xy =  require('./Xy')
const myClock =  require('./Clock')
const config =  require('../../config')
const Agent =  require('./Agent')
const ObservableMulti = require('../reactivity/ObservableMulti')



/**
 * @class Parcel
 * @extends { ObservableMulti< {xy:Xy, carriedBy:Agent, reward:number, expired:boolean} > }
 */
class Parcel extends ObservableMulti {
    
    static #lastId = 0;

    /** @type {string} */
    id;
    
    /** @type {Xy} */
    xy;
    /** @type {number} */
    get x () { return this.xy?.x }
    /** @type {number} */
    get y () { return this.xy?.y }
    
    /** @type {Agent} */
    carriedBy;
    
    /** @type {number} */
    reward;

    /** @type {boolean} */
    expired;
    
    /**
     * @constructor Parcel
     */
    constructor ( xy, carriedBy = null, reward ) {

        super();

        this.id = 'p' + Parcel.#lastId++;

        this.watch('xy');
        this.xy = xy;

        this.watch('carriedBy');
        this.carriedBy = carriedBy;

        // Follow carrier
        /** @type {Agent} */
        var lastCarrier = null;
        const followCarrier = (agent) => { if ( this.carriedBy ) this.xy = this.carriedBy.xy };
        this.on( 'carriedBy', ({carriedBy}) => {
            lastCarrier?.off( 'xy', followCarrier )
            this.carriedBy?.on( 'xy', followCarrier )
            lastCarrier = this.carriedBy;
        } )

        this.watch('reward');
        this.reward = reward || Math.floor( Math.random()*config.PARCEL_REWARD_VARIANCE*2 + config.PARCEL_REWARD_AVG-config.PARCEL_REWARD_VARIANCE );

        this.watch('expired');
        this.expired = false;

        const rewardListener = () => {
            if ( this.reward <= 0 ) {
                this.expired = true;
                this.off( 'reward', rewardListener );
            }
        }
        this.on( 'reward', rewardListener );

        const decay = () => {
            this.reward = Math.floor( this.reward - 1 );
            if ( this.reward <= 0) {
                myClock.off( config.PARCEL_DECADING_INTERVAL, decay );
            }
        };
        myClock.on( config.PARCEL_DECADING_INTERVAL, decay );
        
    }

}



module.exports = Parcel;