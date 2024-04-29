const Grid = require('../deliveroo/Grid');
const myClock =  require('../deliveroo/Clock');
const Config = require('../deliveroo/Config');

class RandomlyMoveAgent {
    /** @type {Promise} Resolves when agent finally stops */
    stopped = Promise.resolve();
    agent                           //the Agent associeted to the autonomous agent
    config

    /**
     * @param {Config} config
     * @param {Grid} grid 
     */
    constructor(config, grid) {

        this.config = config
        this.agent = grid.createAgent({});    // costruct the agent on the grid 

    }

    /**
     * Metodo per avviare il movimento casuale dell'agente
     * @param {Agent} agent L'agente da muovere casualmente
     */
    async _randomlyMove(agent, config) {
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

        console.log('\tStop Randomly Move Agent for ', agent.id)
        console.log('\t\tStop Randomly Move Agent for ', agent.id)
        return;
    }

    async start() {
        await this.stopped;
        this.stopped = this._randomlyMove(this.agent, this.config);
        //console.log('Agent ', this.agent.name + 'started')
        return
    }

    async stop() {
        this.stopMoving = true;
        await this.stopped;
    }
}

module.exports = RandomlyMoveAgent;