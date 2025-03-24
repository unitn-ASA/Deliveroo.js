const Grid = require('../deliveroo/Grid');
const Identity = require('../deliveroo/Identity');
const Agent = require('../deliveroo/Agent');



/**
 * Timeline of NPC
 * 
 * Events:                start()      stop()      stopped      start()
 * runningPromise          | pending                | res/rej   | pending
 * running                 | true                   | false     | true
 * stopRequested    false               | true      | false     
 * 
 * @class
 * @abstract
 * @interface
 */
class NPC {

    /** @type {Agent} */
    agent;

    /**
     * @param {Grid} myGrid
     */
    constructor ( myGrid ) {

        this.agent = myGrid.createAgent( new Identity() );

    }

    /** @type {Promise} Resolves when it stops */
    runningPromise = Promise.resolve();

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
        this.runningPromise = this.moveUntilStopRequested ()
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
        await this.runningPromise.finally( () => {
            this.stopRequested = false;
        } );
    }

    /**
     * Metodo per muovere l'agente finché non viene richiesto di fermarsi
     * @abstract
     * @interface moveUntilStopRequested
     * @returns {Promise} Resolves when agent stops
     */
    async moveUntilStopRequested () {
        throw new Error( 'Not implemented' );
    }

}


module.exports = NPC;
