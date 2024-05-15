const Grid = require('../deliveroo/Grid');
const myClock =  require('../deliveroo/Clock');
const Config = require('../deliveroo/Config');


class RandomlyMoveAgent {

    /** @type {Promise} Resolves when agent stop running */
    running = Promise.resolve();

    /** @type {Agent} */
    agent; //the Agent associated to the autonomous agent
    
    /** @type {Config\} */
    config;

    /**
     * @param {Config} config
     * @param {Grid} grid 
     */
    constructor(config, grid) {
        
        this.config = config;
        this.agent = grid.createAgent({});    // costruct the agent on the grid 
                               
    }

    /**
     * Metodo per avviare il movimento casuale dell'agente
     * @param {Agent} agent L'agente da muovere casualmente
     */
    async #randomlyMove(agent, config) {
        const actions = ['up', 'right', 'down', 'left'];
        let index = Math.floor(Math.random() * 4);

        this.stopMoving = false;
        while (!this.stopMoving) {
            const action = actions[index];
            const moved = await agent[action]();

            if (moved) {
                await new Promise(res => myClock.once(config.RANDOM_AGENT_SPEED, res));
            } else {
                await new Promise(res => setImmediate(res));
            }

            index += [0, 1, 3][Math.floor(Math.random() * 3)];
            index %= 4;
        }

        console.log('\t\tStop Randomly Move Agent for ', agent.id)
        return;
    }

    /**
     * Metodo per avviare il movimento casuale dell'agente
     * @param {Agent} agent L'agente da muovere casualmente
     * @param {Config} config
     * @returns {Promise} Resolves when agent starts after completing presious stop request
     */
    async start() {
        await this.running;
        this.running = this.#randomlyMove(this.agent, this.config);
        //console.log('Agent ', this.agent.name + 'started')
        return
    }

    /**
     * Metodo per fermare il movimento casuale dell'agente
     * @returns {Promise} Resolves when agent finally stops
     */
    async stop() {
        this.stopMoving = true;
        await this.running;
    }

}

module.exports = RandomlyMoveAgent;