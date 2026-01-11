import { myGrid } from '../myGrid.js';
import Identity from '../deliveroo/Identity.js';
import Agent from '../deliveroo/Agent.js';



/**
 * Timeline of NPC
 * 
 * Events:            constructor() start()       stop()        stopped       start()
 * completedPromise    | resolved    | pending     |             | res/rej     | pending
 * running             | false       | true        |             | false       | true
 * stopRequested       | false       |             | true        | false       |
 * 
 * @class
 * @abstract
 * @interface
 */
class NPC {

    /** @type {Agent} */
    agent;

    /**
     * @constructor
     */
    constructor () {

        this.agent = myGrid.createAgent( new Identity() );

    }

    /** @type {Promise} Resolves when it stops */
    completedPromise = Promise.resolve();

    /** @type {boolean} */
    running = false;

    /** @type {boolean} */
    stopRequested = false;

    /**
     * Start moving
     * @returns {Promise} Resolves when agent starts after completing presious stop request
     */
    async start() {
        // check if still running
        if ( this.running )
            return false;
        // start
        this.running = true;
        this.completedPromise = this.execute ()
            .catch ( () => {} ) // avoid unhandled promise rejection
            .finally ( () => {
                this.running = false;
            } )
    }

    /**
     * Metodo per fermare il movimento casuale dell'agente
     * @returns {Promise} Resolves when agent finally stops
     */
    async stop() {
        this.stopRequested = true;
        await this.completedPromise.finally( () => {
            this.stopRequested = false;
        } );
    }

    /**
     * Metodo per muovere l'agente finché non viene richiesto di fermarsi
     * @abstract
     * @interface moveUntilStopRequested
     * @returns {Promise} Resolves when agent stops
     */
    async execute () {
        throw new Error( 'Not implemented' );
    }

}


export default NPC;
