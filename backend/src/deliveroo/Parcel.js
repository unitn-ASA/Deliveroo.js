const ObservableValue =  require('../reactivity/ObservableValue')
const Xy =  require('./Xy')
const myClock =  require('../myClock')
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

    /** @type {Function} - Clock decay listener */
    #decayListener;

    /** @type {Function} - Carrier follower listener */
    #followCarrier;
    
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
        this.#followCarrier = (agent) => { if ( this.carriedBy ) this.xy = this.carriedBy.xy };
        this.on( 'carriedBy', ({carriedBy}) => {
            lastCarrier?.off( 'xy', this.#followCarrier )
            this.carriedBy?.on( 'xy', this.#followCarrier )
            lastCarrier = this.carriedBy;
        } )

        this.watch('reward');
        {
            let random = Math.random();
            let va = config.PARCEL_REWARD_VARIANCE;
            let avg = config.PARCEL_REWARD_AVG;
            this.reward = reward || Math.floor( (random * va * 2) + (avg - va) ); // FIXED formulae; the +avg was being concatenated instead of summed. Still make no sense, who knows...
            // console.log( "Parcel.js reward:",  `${reward} || ${random} * ${va} * 2 + ${avg} - ${va} = ${random * va * 2} + ${avg} - ${va} = ${random * va * 2 + avg} - ${va} =Floor(${random * va * 2 + avg - va}) = ${this.reward}` ); // + avg were being concatenated instead of summed. who knows?
        }

        this.watch('expired');
        this.expired = false;

        const rewardListener = () => {
            if ( this.reward <= 0 ) {
                this.expired = true;
                this.off( 'reward', rewardListener );
            }
        }
        this.on( 'reward', rewardListener );

        this.#decayListener = () => {
            this.reward = Math.floor( this.reward - 1 );
            if ( this.reward <= 0) {
                myClock.off( config.PARCEL_DECADING_INTERVAL, this.#decayListener );
            }
        };
        myClock.on( config.PARCEL_DECADING_INTERVAL, this.#decayListener );
        
    }

    /**
     * Cleanup method to remove event listeners and prevent memory leaks
     */
    cleanup() {
        // Remove clock listener
        if ( this.#decayListener ) {
            myClock.off( config.PARCEL_DECADING_INTERVAL, this.#decayListener );
        }
        // Remove carrier follower listener
        if ( this.carriedBy && this.#followCarrier ) {
            this.carriedBy.off( 'xy', this.#followCarrier );
        }
    }

}



module.exports = Parcel;