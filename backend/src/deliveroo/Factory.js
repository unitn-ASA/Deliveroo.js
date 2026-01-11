import Agent from './Agent.js';
import GhostAgent from '../../plugins/GhostAgent.js';
import PushAgent from '../../plugins/PushAgent.js';
import Identity from './Identity.js';
import Grid from './Grid.js';
import { config } from '../config/config.js';



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
        
        if ( config.GAME.player.agent_type ) {
            
            if ( config.GAME.player.agent_type === 'DefaultAgent' ) {
                return new Agent( grid, identity );
            }

            if ( config.GAME.player.agent_type === 'GhostAgent' ) {
                return new GhostAgent( grid, identity );
            }

            if ( config.GAME.player.agent_type === 'PushAgent' ) {
                return new PushAgent( grid, identity );
            }

        }

        return new Agent( grid, identity );
    }

}



export default Factory;
