import Xy from './Xy.js';
import eventEmitter from 'events';

/** @typedef {import('@unitn-asa/deliveroo-js-sdk/types/IOCrate.js').IOCrate} IOCrate */



/**
 * @typedef {{xy: [Xy], deleted: [Crate]}} CrateEventsMap
 */



/**
 * A Crate is a pushable object that cannot be picked up.
 * It can be pushed by agents to adjacent tiles.
 *
 * @class Crate
 */
class Crate {

    /** @type { eventEmitter<CrateEventsMap> } */
    #emitter;
    get emitter () { return this.#emitter; }

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

    /**
     * Creates a new Crate.
     * @constructor
     * @param {Xy} xy - The initial position of the crate
     */
    constructor ( xy ) {

        this.#emitter = new eventEmitter();
        this.#emitter.setMaxListeners(0); // unlimited listeners

        this.#id = 'c' + Crate.#lastId++;
        this.xy = xy;

    }

}



export default Crate;
