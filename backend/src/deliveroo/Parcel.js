import Xy from './Xy.js';
import myClock from '../myClock.js';
import { config } from '../config/config.js';
import Agent from './Agent.js';
import eventEmitter from 'events';
import { watchProperty } from '../reactivity/watchProperty.js';
import { atNextTick } from '../reactivity/postponeAt.js';

/** @typedef {import('@unitn-asa/deliveroo-js-sdk/types/IOParcel.js').IOParcel} IOParcel */



/**
 * @typedef {{xy: [Xy], carriedBy: [Agent], reward: [number], expired: [boolean], deleted: [Parcel]}} ParcelEventsMap
 */



/**
 * A Parcel is a reward object that can be carried by agents.
 * Parcels decay over time, losing reward value until they expire.
 *
 * @class Parcel
 * @implements { IOParcel }
 */
class Parcel {

    /** @type { eventEmitter<ParcelEventsMap> } */
    #emitter;
    get emitter () { return this.#emitter; }

    /** @type {number} */
    static #lastId = 0;
    /** @type {string} */
    #id;
    get id () { return this.#id; }

    /** @type {Xy} */
    xy;
    /** @type {number} */
    get x () { return this.xy?.x }
    /** @type {number} */
    get y () { return this.xy?.y }



    /** @type {Agent} */
    carriedBy;

    /** @type { function(Xy) : void } - Carrier follower listener */
    #carrierListener;



    /** @type {number} */
    reward;

    /** @type {boolean} */
    expired;

    /** @type { function(...any) : void } - Clock decay listener */
    #decayListener;



    /**
     * Creates a new Parcel.
     * @constructor
     * @param {Xy} xy - Initial position
     * @param {Agent} [carriedBy=null] - Optional carrier agent
     * @param {number} [reward] - Optional reward value (auto-generated if not provided)
     * @override
     */
    constructor ( xy, carriedBy = null, reward ) {

        this.#emitter = new eventEmitter();
        this.#emitter.setMaxListeners(0); // unlimited listeners

        this.#id = 'p' + Parcel.#lastId++;

        // xy watching
        watchProperty({
            target: this,
            key: 'xy',
            callback: atNextTick( (target, key, value) => target.#emitter.emit(key, value) )
        });
        this.xy = xy;

        // carriedBy watching
        watchProperty({
            target: this,
            key: 'carriedBy',
            callback: atNextTick( (target, key, value) => target.#emitter.emit(key, value) )
        });
        this.carriedBy = carriedBy;

        // Follow carrier
        /** @type {Agent} */
        var lastCarrier = null;
        this.#carrierListener = (xy) => {
            if ( this.carriedBy ) this.xy = this.carriedBy.xy;
        };
        this.emitter.on( 'carriedBy', atNextTick( () => {
            lastCarrier?.emitter?.off( 'xy', this.#carrierListener );
            this.carriedBy?.emitter?.on( 'xy', this.#carrierListener );
            lastCarrier = this.carriedBy;
        } ) );

        // reward watching
        watchProperty({
            target: this,
            key: 'reward',
            callback: (target, key, value) => target.emitter.emit(key, value)
        });
        {
            let random = Math.random();
            let va = config.GAME.parcels.reward_variance;
            let avg = config.GAME.parcels.reward_avg;
            this.reward = reward || Math.floor( (random * va * 2) + (avg - va) ); // FIXED formulae; the +avg was being concatenated instead of summed. Still make no sense, who knows...
            // console.log( "Parcel.js reward:",  `${reward} || ${random} * ${va} * 2 + ${avg} - ${va} = ${random * va * 2} + ${avg} - ${va} = ${random * va * 2 + avg} - ${va} =Floor(${random * va * 2 + avg - va}) = ${this.reward}` ); // + avg were being concatenated instead of summed. who knows?
        }

        // expired watching
        watchProperty({
            target: this,
            key: 'expired',
            callback: (target, key, value) => target.emitter.emit(key, value)
        });
        this.expired = false;

        // Auto-expire when reward reaches 0
        const rewardListener = () => {
            if ( this.reward <= 0 ) {
                this.expired = true;
                this.emitter.off( 'reward', rewardListener );
            }
        };
        this.emitter.on( 'reward', rewardListener );

        // Decay over time
        this.#decayListener = () => {
            this.reward = Math.floor( this.reward - 1 );
            if ( this.reward <= 0 ) {
                myClock.off( config.GAME.parcels.decading_event, this.#decayListener );
            }
        };
        myClock.on( config.GAME.parcels.decading_event, this.#decayListener );

    }

    /**
     * Cleanup method to remove event listeners and prevent memory leaks
     */
    cleanup() {
        // Emit deleted event
        this.#emitter.emit( 'deleted', this );
        
        // Remove clock listener
        if ( this.#decayListener ) {
            myClock.off( config.GAME.parcels.decading_event, this.#decayListener );
        }

        // Remove carrier follower listener
        if ( this.carriedBy && this.#carrierListener ) {
            this.carriedBy.emitter?.off( 'xy', this.#carrierListener );
        }
        
        // Remove all other listeners
        this.#emitter.removeAllListeners();
    }

}



export default Parcel;
