import Xy from './Xy.js';
import SpatialObject from './SpatialObject.js';

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
class Crate extends SpatialObject {

    static #lastId = 0;
    /** @type {string} */
    #id;
    get id () { return this.#id; }

    /**
     * Creates a new Crate.
     * @constructor
     * @param {Xy} xy - The initial position of the crate
     */
    constructor ( xy ) {
        super({ xy });

        this.#id = 'c' + Crate.#lastId++;
    }

}



export default Crate;
