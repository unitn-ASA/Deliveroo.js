import Grid from '../deliveroo/Grid.js';
import { config } from '../config/config.js';
import randomlyMovingAgent from './RandomlyMovingNPC.js';
import NPC from './NPC.js';
import myClock from '../myClock.js';


/** @typedef {import('@unitn-asa/deliveroo-js-sdk/types/IOGameOptions.js').IONpcsOptions} IONpcsOptions */

/**
 * @class 
 */
class NPCspawner {
    
    /** @type {Grid} */
    #grid;

    /** @type {IONpcsOptions} */
    #options;

    /** @type {Map<String,NPC>} */
    NPCs = new Map();
    
    /**
     * @param {Grid} grid
     * @param {IONpcsOptions} options
     */
    constructor (grid, options) {

        this.#grid = grid;
        this.#options = options;


        myClock.on( '2s', () => {

            while ( this.NPCs.size < this.#options.count ) {

                console.log(`NPCspawner: currently have ${this.NPCs.size} randomly moving agents, target is ${this.#options.count}`);
                
                if ( this.NPCs.size < this.#options.count ) {
                    this.createNPC();
                }
                
                else if ( this.NPCs.size > this.#options.count ) {
                    let id = this.NPCs.keys().next().value;
                    this.removeNPC( id );
                }

            }

        } );

    }

    /**
     * Add a new NPC
     * @returns {NPC} NPC id
     */
    createNPC () {
        let NPC = new randomlyMovingAgent( this.#options );
        this.NPCs.set( NPC.agent.identity.id, NPC );
        this.#grid.onAgent( "deleted" , (ev, agent) => {
            if ( agent.id == NPC.agent.id ) {
                this.removeNPC( NPC.agent.identity.id );
            }
        } );
        NPC.start();
        return NPC;
    }

    /**
     * Remove NPC
     * @param {String} id 
     */
    async removeNPC ( id ) {
        let NPC = this.NPCs.get( id );
        if ( NPC ) {
            this.NPCs.delete( id );
            await NPC.stop();
            this.#grid.deleteAgent( NPC.agent );
        }
    }

}



export default NPCspawner;
