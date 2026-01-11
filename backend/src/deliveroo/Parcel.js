import ObservableValue from '../reactivity/ObservableValue.js';
import Xy from './Xy.js';
import myClock from '../myClock.js';
import { config } from '../config/config.js';
import Agent from './Agent.js';
import ObservableMulti from '../reactivity/ObservableMulti.js';



/**
 * @typedef {import('../types').ParcelType} ParcelType
 */



/**
 * @class Parcel
 * @extends { ObservableMulti< {xy:Xy, carriedBy:Agent, reward:number, expired:boolean} > }
 * @implements { ParcelType }
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

    /** @type { function(...any) : void } - Clock decay listener */
    #decayListener;

    /** @type { function(...any) : void } - Carrier follower listener */
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
            let va = config.GAME.parcels.reward_variance;
            let avg = config.GAME.parcels.reward_avg;
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
                myClock.off( config.GAME.parcels.decading_event, this.#decayListener );
            }
        };
        myClock.on( config.GAME.parcels.decading_event, this.#decayListener );
        
    }

    /**
     * Cleanup method to remove event listeners and prevent memory leaks
     */
    cleanup() {
        // Remove clock listener
        if ( this.#decayListener ) {
            myClock.off( config.GAME.parcels.decading_event, this.#decayListener );
        }
        // Remove carrier follower listener
        if ( this.carriedBy && this.#followCarrier ) {
            this.carriedBy.off( 'xy', this.#followCarrier );
        }
    }

}



export default Parcel;