import Xy from './Xy.js';
import myClock from '../myClock.js';
import { config } from '../config/config.js';
import Agent from './Agent.js';
import eventEmitter from 'events';
import { watchProperty } from '../reactivity/watchProperty.js';



/** @typedef {import('@unitn-asa/deliveroo-js-sdk/types/IOParcel.js').IOParcel} IOParcel */



/**
 * @class Parcel
 * @implements { IOParcel }
 */
class Parcel {

    /**
     * @typedef {{xy: [Xy], carriedBy: [Agent], reward: [number], expired: [boolean]}} EventsMap
     * @type { eventEmitter<EventsMap> }
    */
    #emitter = new eventEmitter();
    get emitter () { return this.#emitter; }

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

        this.#emitter.setMaxListeners(0); // unlimited listeners

        this.id = 'p' + Parcel.#lastId++;

        watchProperty({
            target: this,
            key: 'xy',
            callback: (target, key, value) => target.#emitter.emit(key, value)
        });
        this.xy = xy;

        watchProperty({
            target: this,
            key: 'carriedBy',
            callback: (target, key, value) => target.#emitter.emit(key, value)
        });
        this.carriedBy = carriedBy;

        // Follow carrier
        /** @type {Agent} */
        var lastCarrier = null;
        this.#followCarrier = (agent) => { if ( this.carriedBy ) this.xy = this.carriedBy.xy };
        this.#emitter.on( 'carriedBy', () => {
            lastCarrier?.emitter?.off( 'xy', this.#followCarrier )
            this.carriedBy?.emitter?.on( 'xy', this.#followCarrier )
            lastCarrier = this.carriedBy;
        } )

        watchProperty({
            target: this,
            key: 'reward',
            callback: (target, key, value) => target.#emitter.emit(key, value)
        });
        {
            let random = Math.random();
            let va = config.GAME.parcels.reward_variance;
            let avg = config.GAME.parcels.reward_avg;
            this.reward = reward || Math.floor( (random * va * 2) + (avg - va) ); // FIXED formulae; the +avg was being concatenated instead of summed. Still make no sense, who knows...
            // console.log( "Parcel.js reward:",  `${reward} || ${random} * ${va} * 2 + ${avg} - ${va} = ${random * va * 2} + ${avg} - ${va} = ${random * va * 2 + avg} - ${va} =Floor(${random * va * 2 + avg - va}) = ${this.reward}` ); // + avg were being concatenated instead of summed. who knows?
        }

        watchProperty({
            target: this,
            key: 'expired',
            callback: (target, key, value) => target.#emitter.emit(key, value)
        });
        this.expired = false;

        const rewardListener = () => {
            if ( this.reward <= 0 ) {
                this.expired = true;
                this.#emitter.off( 'reward', rewardListener );
            }
        }
        this.#emitter.on( 'reward', rewardListener );

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
            this.carriedBy.emitter?.off( 'xy', this.#followCarrier );
        }
    }

}



export default Parcel;
