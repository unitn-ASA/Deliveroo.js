import Agent from './Agent.js';
import GhostAgent from '../../plugins/GhostAgent.js';
import PushAgent from '../../plugins/PushAgent.js';
import Identity from './Identity.js';
import Grid from './Grid.js';
import SpatialRegistry from './SpatialRegistry.js';
import { config } from '../config/config.js';



/**
 * Factory for creating Agent entities with automatic spatial registration.
 *
 * @class Factory
 * @classdesc AgentFactory for creating different types of agents
 */
class AgentFactory {

    #registry;

    /**
     * Creates a new AgentFactory.
     * @constructor
     * @param {SpatialRegistry<Agent>} registry - Optional spatial registry for tracking agents
     */
    constructor ( registry ) {
        this.#registry = registry;
    }

    /**
     * Creates an agent based on the configured agent type.
     * @param {Grid} grid - The game grid
     * @param {Identity} identity - The agent's identity
     * @returns {Agent} The created agent
     */
    static createAgent ( grid, identity ) {

        /** @type {Agent} */
        let agent;

        if ( config.GAME.player.agent_type ) {

            if ( config.GAME.player.agent_type === 'DefaultAgent' ) {
                agent = new Agent( grid, identity );
            }

            if ( config.GAME.player.agent_type === 'GhostAgent' ) {
                agent = new GhostAgent( grid, identity );
            }

            if ( config.GAME.player.agent_type === 'PushAgent' ) {
                agent = new PushAgent( grid, identity );
            }

        }

        if ( ! agent ) {
            agent = new Agent( grid, identity );
        }

        return agent;

    }

    /**
     * Creates an agent based on the configured agent type and registers it.
     * @param {Grid} grid - The game grid
     * @param {Identity} identity - The agent's identity
     * @returns {Agent} The created agent
     */
    createAgent ( grid, identity ) {

        const agent = AgentFactory.createAgent( grid, identity );

        // Register with spatial registry
        this.#registry.updateSpatialIndex( agent );

        // Listener to update spatial index on xy changes, bound to registry
        const listener = this.#registry.updateSpatialIndex.bind( this.#registry, agent );

        // Track xy changes to update spatial index
        agent.emitter.on( 'xy', listener );

        agent.emitter.once( 'deleted', () => {
            // Stop tracking xy changes
            agent.emitter.off( 'xy', listener );
            // Remove from spatial registry
            this.#registry.remove( agent.id );
        } );

        return agent;

    }

}



export default AgentFactory;
