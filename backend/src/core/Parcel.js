import Xy from './Xy.js';
import Agent from './Agent.js';
import { watchProperty } from '../reactivity/watchProperty.js';
import { atNextTick } from '../reactivity/postponeAt.js';
import SpatialObject from './SpatialObject.js';

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
class Parcel extends SpatialObject {

    /** @type {number} */
    static #lastId = 0;
    /** @type {string} */
    #id;
    get id () { return this.#id; }

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
     * @param {number} [reward] - Optional reward value (assigned as-is; reward policy is handled by the caller)
     * @override
     */
    constructor ( xy, carriedBy = null, reward ) {
        super({ xy });

        this.#id = 'p' + Parcel.#lastId++;

        // carriedBy watching
        watchProperty({
            target: this,
            key: 'carriedBy',
            callback: atNextTick((target, key, value) => {
                target.emitter.emit(key, value);
                target.emitter.emit('changed', { object: target, key });
            })
        });
        this.carriedBy = carriedBy;

        // reward watching
        watchProperty({
            target: this,
            key: 'reward',
            callback: (target, key, value) => {
                target.emitter.emit(key, value);
                target.emitter.emit('changed', { object: target, key });
            }
        });
        this.reward = reward;

        // expired watching
        watchProperty({
            target: this,
            key: 'expired',
            callback: (target, key, value) => {
                target.emitter.emit(key, value);
                target.emitter.emit('changed', { object: target, key });
            }
        });
        this.expired = false;

        // Auto-expire when reward reaches 0
        const rewardListener = () => {
            if ( this.reward <= 0 ) {
                this.expired = true;
            }
        };
        this.emitter.on( 'reward', rewardListener );
        // Clean up reward listener when parcel is deleted
        this.emitter.once( 'deleted', () => {
            this.emitter.off( 'reward', rewardListener );
        } );

    }

    /**
     * Deletes the parcel, emitting a 'deleted' event and cleaning up listeners.
     * A carried parcel that vanishes (decay while carried, admin dispose,
     * map restart, ...) frees its carrier's capacity slot.
     */
    delete () {
        this.carriedBy?.carryingParcels?.delete( this );
        this.carriedBy = null;
        super.delete();
    }

}



export default Parcel;
