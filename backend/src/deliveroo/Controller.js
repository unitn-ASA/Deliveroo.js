
import Agent from './Agent.js';
import { config } from '../config/config.js';
import Xy from './Xy.js';
import Grid from './Grid.js';
import Parcel from './Parcel.js';
import myClock from '../myClock.js';
import Tile from './Tile.js';


/** @typedef {import('@unitn-asa/deliveroo-js-sdk/types/IOAgent.js').IOAgent} IOAgent */

/**
 * @typedef {{xy: [Xy], score: [number], penalty: [number], carryingParcels: [Set<Parcel>], deleted: [Controller]}} AgentEventsMap
*/

const MOVEMENT_STEPS = 1;

/**
 * @class Controller
*/
class Controller {
    
    /** @type {Grid} #grid */
    #grid;
    /** @property {Grid} */
    get grid () { return this.#grid }

    /** @type {Agent} agent */
    #agent;
    get agent () { return this.#agent }



    /**
     * @constructor Controller
     * @param {Grid} grid
     * @param {Agent} agent
     */
    constructor ( grid, agent ) {

        this.#grid = grid;

        this.#agent = agent;

    }



    async up () {
        return await this.#agent.actionMutex.execute( () => this.move(this.#agent, 0, 1) );
    }

    async down () {
        return await this.#agent.actionMutex.execute( () => this.move(this.#agent, 0, -1) );
    }

    async left () {
        return await this.#agent.actionMutex.execute( () => this.move(this.#agent, -1, 0) );
    }

    async right () {
        return await this.#agent.actionMutex.execute( () => this.move(this.#agent, 1, 0) );
    }

    /**
     * Move an agent by the given increments
     * @param {import('../deliveroo/Agent.js').default} agent - The agent to move
     * @param {number} incr_x - X increment (-1, 0, or 1)
     * @param {number} incr_y - Y increment (-1, 0, or 1)
     * @returns {Promise<Xy|boolean>} The new position if successful, false otherwise
     */
    async move(agent, incr_x, incr_y) {
        const fromTile = agent.tile;
        if (!fromTile) {
            return false;
        }

        const toTile = this.#grid.tileRegistry.getOneByXy(
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
        if (!toTile || !toTile.walkable || toTile.locked) {
            agent.penalty -= config.PENALTY;
            return false;
        }
        
        // Check if there's a crate on the destination tile and try to push it
        const crate = this.#grid.crateRegistry.getOneByXy( { x: agent.x + incr_x, y: agent.y + incr_y } );
        if ( crate ) {
            const crateDestTile = this.#grid.tileRegistry.getOneByXy( { x: crate.x + incr_x, y: crate.y + incr_y } );

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
                const crateAtDest = this.#grid.crateRegistry.getOneByXy( new Xy( { x: crate.x + incr_x, y: crate.y + incr_y } ) );
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



    /**
     * Execute step-by-step animated movement
     * @param {import('../deliveroo/Agent.js').default} agent
     * @param {Tile} fromTile
     * @param {Tile} toTile
     */
    static async stepByStep(agent, fromTile, toTile) {
        const incr_x = toTile.x - fromTile.x;
        const incr_y = toTile.y - fromTile.y;

        // Lock destination tile
        toTile.lock();

        const init_x = agent.x;
        const init_y = agent.y;

        if (MOVEMENT_STEPS) {
            // Immediate offset by 0.6*step
            agent.xy = new Xy({
                x: (100 * agent.x + 100 * incr_x / MOVEMENT_STEPS * 12 / 20) / 100,
                y: (100 * agent.y + 100 * incr_y / MOVEMENT_STEPS * 12 / 20) / 100
            });
        }

        for (let i = 0; i < MOVEMENT_STEPS; i++) {
            await myClock.synch(config.GAME.player.movement_duration / MOVEMENT_STEPS);
            if (i < MOVEMENT_STEPS - 1) {
                // Move by one step = 1 / MOVEMENT_STEPS
                agent.xy = new Xy({
                    x: (100 * agent.x + 100 * incr_x / MOVEMENT_STEPS) / 100,
                    y: (100 * agent.y + 100 * incr_y / MOVEMENT_STEPS) / 100
                });
            }
        }

        // Finally at exact destination
        agent.xy = new Xy({
            x: init_x + incr_x,
            y: init_y + incr_y
        });

        // Unlock tiles after movement
        fromTile.unlock();
    }



    /**
     * Pick up all parcels in the agent tile.
     * @function pickUp
     * @returns {Promise<Parcel[]>} An array of parcels that have been picked up
     */
    async pickUp () {
        return await this.#agent.actionMutex.execute( async () => {
            const picked = new Array();
            for (const parcel of this.#grid.parcelRegistry.getByXy(this.#agent?.xy?.rounded)) {
                if (parcel.carriedBy == null) {
                    this.#agent.carryingParcels.add(parcel);
                    parcel.carriedBy = this.#agent;
                    picked.push(parcel);
                }
            }
            return picked;
        } ) || [];
    }



    /**
     * Put down parcels:
     * - if array of ids is provided: putdown only specified parcels
     * - if no list is provided: put down all parcels
     * @function putDown
     * @param {string[]} ids An array of parcels id
     * @returns {Promise<Parcel[]>} An array of parcels that have been put down
     */
    async putDown (ids = []) {
        return await this.#agent.actionMutex.execute( async () => {
            const tile = this.#agent.tile;
            let scoreAdded = 0;
            const dropped = new Array();
            let toPutDown = Array.from(this.#agent.carryingParcels.values());

            if (ids && ids.length && ids.length > 0) {
                toPutDown = toPutDown.filter(p => ids.includes(p.id));
            }

            for (const parcel of toPutDown) {
                this.#agent.carryingParcels.delete(parcel);
                parcel.carriedBy = null;
                dropped.push(parcel);

                if (tile?.delivery) {
                    scoreAdded += parcel.reward;
                    parcel.delete();
                }
            }

            // Update agent score and log
            this.#agent.score += scoreAdded;
            if (scoreAdded > 0) {
                console.log(`${this.#agent.name}(${this.#agent.id}) putDown ${dropped.length} parcels (+ ${scoreAdded} pti -> ${this.#agent.score} pti)`);
            }

            return dropped;
        } ) || [];
    }

}



export default Controller;
