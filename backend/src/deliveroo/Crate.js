import Xy from './Xy.js';
import { watchProperty } from '../reactivity/watchProperty.js';
import eventEmitter from 'events';



/**
 * @class Crate
 *
 * A Crate is a pushable object that cannot be picked up.
 * It can be pushed by agents to adjacent tiles.
 */
class Crate {
    
    /**
     * @typedef {{xy: [Xy]}} EventsMap
     * @type { eventEmitter<EventsMap> }
    */
    #emitter = new eventEmitter();
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
     * @constructor Crate
     * @param {Xy} xy - The initial position of the crate
     */
    constructor ( xy ) {
        
        this.#emitter = new eventEmitter();
        this.#emitter.setMaxListeners(0); // unlimited listeners
        
        this.#id = 'c' + Crate.#lastId++;

        watchProperty({
            target: this,
            key: 'xy',
            callback: (target, key, value) => target.#emitter.emit(key, value)
        });

        this.xy = xy; // Set and emit initial position

    }

}



export default Crate;
