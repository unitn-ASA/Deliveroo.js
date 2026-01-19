import Xy from './Xy.js';
import ObservableMulti from '../reactivity/ObservableMulti.js';



/**
 * @class Crate
 * @extends { ObservableMulti< {xy:Xy} > }
 *
 * A Crate is a pushable object that cannot be picked up.
 * It can be pushed by agents to adjacent tiles.
 */
class Crate extends ObservableMulti {

    static #lastId = 0;

    /** @type {string} */
    id;

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

        super();

        this.id = 'c' + Crate.#lastId++;

        this.watch('xy');
        this.xy = xy;

    }

}



export default Crate;
