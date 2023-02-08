const Grid = require('../Grid');
const {Observable, staticObservable} =  require('./utils/Observable')



/**
 * @class Deliveroo
 */
class Deliveroo {
    #grid;
    
    /**
     * @constructor Deliveroo
     */
    constructor () {
        this.#grid = new Grid();
    }

    /**
     * @type {function(string): Agent}
     */
    getAgent ( id ) {
        if ( !this.#agents.has(id) )
            this.#agents.set(id, new Agent(id, this));
        return this.#agents.get(id);
    }

}


module.exports = Deliveroo;