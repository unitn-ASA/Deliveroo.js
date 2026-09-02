import Agent from '../core/Agent.js';



/**
 * Timeline of an autopilot
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
class Autopilot {

    /** @type {Agent} */
    agent;

    /** @type {Promise} Resolves when it stops */
    completedPromise = Promise.resolve();

    /** @type {boolean} */
    running = false;

    /** @type {boolean} */
    stopRequested = false;

    /**
     * Start controlling an agent.
     * @param {Agent} [agent]
     * @returns {Promise<boolean|undefined>}
     */
    async start(agent = this.agent) {
        // check if still running
        if ( this.running )
            return false;
        if ( ! agent )
            throw new Error('Autopilot.start(): an agent is required');
        this.agent = agent;
        // start
        this.running = true;
        this.completedPromise = this.execute ()
            .catch ( () => {} ) // avoid unhandled promise rejection
            .finally ( () => {
                this.running = false;
            } )
    }

    /**
     * Stop controlling the agent.
     * @returns {Promise} Resolves when agent finally stops
     */
    async stop() {
        this.stopRequested = true;
        await this.completedPromise.finally( () => {
            this.stopRequested = false;
        } );
    }

    /**
     * Run until a stop is requested.
     * @abstract
     * @interface moveUntilStopRequested
     * @returns {Promise} Resolves when agent stops
     */
    async execute () {
        throw new Error( 'Not implemented' );
    }

}


export default Autopilot;
