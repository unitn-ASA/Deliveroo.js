import Agent from './Agent.js';
import Identity from './Identity.js';
import Grid from './Grid.js';
import config from '../../config.js';

global.DefaultAgent = Agent;
config.loadPlugins();



/**
 * @class
 */
class Factory {

    /**
     * @property {} createAgent
     * @param {Grid} grid
     * @param {Identity} identity
     * @returns {Agent}
     */
    static createAgent ( grid, identity ) {
        
        if ( config.AGENT_TYPE ) {
            try {
                if ( ! global[config.AGENT_TYPE] )
                    throw new Error( `global.${config.AGENT_TYPE} is not defined` );
                return new ( global[config.AGENT_TYPE] )( grid, identity );
            } catch (error) {
                console.warn( `WARN AgentFactory.createAgent cannot load config.AGENT_TYPE='${config.AGENT_TYPE}', switch to Agent.js class.`, error );
            }
        }
        
        // if (typeof Agent !== 'function') {
        //     throw new TypeError('Agent is not a constructor');
        // }

        return new Agent( grid, identity );
    }

}



export default Factory;