console.log('PushAgent.js loaded');

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
class PushAgent extends Agent {

    /**
     * @param {Grid} grid
     * @param {Identity} identity
     */
    constructor ( grid, identity ) {
        super ( grid, identity );
        
        // Override the move method to implement agent pushing
        super.controller.move = async function ( agent, incr_x, incr_y ) {
            const fromTile = agent.tile;
            if (!fromTile) {
                return false;
            }

            const toTile = this.grid.tileRegistry.getOneByXy(
                { x: agent.x + incr_x, y: agent.y + incr_y }
            );

            // Check directional tile exit restrictions
            if (fromTile.isDirectional && !fromTile.allowsExitInDirection(incr_x, incr_y)) {
                agent.penalty -= config.PENALTY;
                return false;
            }

            // Check directional tile entry restrictions
            if (toTile && toTile.isDirectional && !toTile.allowsMovementFrom(agent.x, agent.y)) {
                agent.penalty -= config.PENALTY;
                return false;
            }

            // Check destination tile
            if (!toTile || !toTile.walkable) {
                agent.penalty -= config.PENALTY;
                return false;
            }

            // Check if there's an agent on the destination tile and try to push it
            const tobePushedAgent = this.grid.agentRegistry.getOneByXy( { x: agent.x + incr_x, y: agent.y + incr_y } );
            if ( tobePushedAgent ) {
                // Try to push the agent
                const pushResult = await tobePushedAgent.controller.move( tobePushedAgent, incr_x, incr_y );
                if ( !pushResult ) {
                    agent.penalty -= config.PENALTY;
                    return false;
                }
            }

            // Check if there's a crate on the destination tile and try to push it
            const crate = this.grid.crateRegistry.getOneByXy( { x: agent.x + incr_x, y: agent.y + incr_y } );
            if ( crate ) {
                const crateDestTile = this.grid.tileRegistry.getOneByXy( { x: crate.x + incr_x, y: crate.y + incr_y } );

                // Check if the crate can be pushed to the destination tile
                // Must be type "5", unlocked, and not blocked by other entities
                if (!crateDestTile || !crateDestTile.type.startsWith("5") || crateDestTile.locked) {
                    // Cannot push crate, movement fails
                    agent.penalty -= config.PENALTY;
                    // console.warn( `${this.name}(${this.id}) blocked by crate: cannot push to destination (not type 5 or locked)` );
                    return false;
                }

                // Check if destination tile has any crates
                {
                    const crateAtDest = this.grid.crateRegistry.getOneByXy( new Xy( { x: crate.x + incr_x, y: crate.y + incr_y } ) );
                    if ( crateAtDest ) {
                        // Cannot push crate onto another crate
                        agent.penalty -= config.PENALTY;
                        // console.warn( `${this.name}(${this.id}) blocked by crate: destination has another crate` );
                        return false;
                    }
                }

                // Push the crate
                crate.xy = new Xy( crateDestTile.x, crateDestTile.y );
            }

            // Execute step-by-step movement
            await Controller.stepByStep(agent, fromTile, toTile);

            return agent.xy;
        }

        console.log("I am a PushAgent", identity.name, `(${identity.id})`);
    }
    
}



export default PushAgent;
