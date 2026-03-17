import Xy from './Xy.js';
import myClock from '../myClock.js';
import { myGrid } from '../myGrid.js';
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
 * It once used to implements { IOParcel }
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



    /** @type {number} */
    reward;

    /** @type {boolean} */
    expired;



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

        // reward watching
        watchProperty({
            target: this,
            key: 'reward',
            callback: (target, key, value) => target.emitter.emit(key, value)
        });
        // Use RewardDecayingSystem for reward calculation
        this.reward = myGrid.rewardDecayingSystem.calculateReward(reward);

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

    }

    /**
     * Deletes the parcel, emitting a 'deleted' event and cleaning up listeners.
     */
    delete () {
        this.#emitter.emit( 'deleted', this );
        this.#emitter.removeAllListeners();
    }

}



export default Parcel;
