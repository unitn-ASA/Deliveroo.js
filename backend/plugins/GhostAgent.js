import Agent from '../src/deliveroo/Agent.js';
import Grid from '../src/deliveroo/Grid.js';
import Identity from '../src/deliveroo/Identity.js';
import Controller from '../src/deliveroo/Controller.js';
import Xy from '../src/deliveroo/Xy.js';
import { config } from '../src/config/config.js';

/**
 * @class
 * @extends Agent
 */
class GhostAgent extends Agent {

    /**
     * @param {Grid} grid
     * @param {Identity} identity
     */
    constructor ( grid, identity ) {
        super ( grid, identity );

        // Override the move method to implement ghost agent behavior (ignoring collisions and tile restrictions)
        super.controller.move = async function ( agent, incr_x, incr_y ) {
            const fromTile = agent.tile;
            if (!fromTile) {
                return false;
            }

            const toTile = this.grid.tileRegistry.getOneByXy(
                { x: agent.x + incr_x, y: agent.y + incr_y }
            );

            // Check destination tile
            if (!toTile) {
                agent.penalty -= config.PENALTY;
                return false;
            }

            // Execute step-by-step movement
            await Controller.stepByStep(agent, fromTile, toTile);

            return agent.xy;
        }

        console.log("I am a ghost", identity);
    }
    
}



export default GhostAgent;
