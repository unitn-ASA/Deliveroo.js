const Grid = require('../deliveroo/Grid');
const myClock =  require('../deliveroo/Clock');
const Config = require('../deliveroo/Config');


class RandomlyMoveAgent {
    /**
     * @param {Config} config
     * @param {Grid} myGrid 
     */
    constructor(config, myGrid) {
        
        var myAgent = myGrid.createAgent({});
        this.randomlyMove (myAgent, config)
    }

    /**
     * Metodo per avviare il movimento casuale dell'agente
     * @param {Agent} agent L'agente da muovere casualmente
     */
    async randomlyMove(agent, config) {
        const actions = ['up', 'right', 'down', 'left'];
        let index = Math.floor(Math.random() * 4);

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
        return;
    }

    /**
     * Metodo per fermare il movimento casuale dell'agente
     */
    async stopAgentMovement() {
        this.stopMoving = true;
    }
}

module.exports = RandomlyMoveAgent;