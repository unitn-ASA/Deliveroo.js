import Agent from './Agent.js';
import Identity from './Identity.js';
import Grid from './Grid.js';
import SpatialRegistry from './SpatialRegistry.js';



/**
 * Factory for creating Agent entities with automatic spatial registration.
 *
 * Agent behaviour variants are components attached after creation. Components
 * register their handlers directly on the agent-local command bus.
 *
 * @class Factory
 * @classdesc AgentFactory for creating agents
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
     * Creates an agent and registers it.
     * @param {Grid} grid - The game grid
     * @param {Identity} identity - The agent's identity
     * @returns {Agent} The created agent
     */
    createAgent ( grid, identity ) {

        const agent = new Agent( grid, identity );

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
