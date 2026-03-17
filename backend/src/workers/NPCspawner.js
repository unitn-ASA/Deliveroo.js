import Grid from '../deliveroo/Grid.js';
import randomlyMovingAgent from './RandomlyMovingNPC.js';
import IntelligentParcelNPC from './IntelligentParcelNPC.js';
import NPC from './NPC.js';
import myClock from '../myClock.js';


/** @typedef {import('@unitn-asa/deliveroo-js-sdk/types/IOGameOptions.js').IONpcsOptions} IONpcsOptions */

/**
 * @class 
 */
class NPCspawner {
    
    /** @type {Grid} */
    #grid;

    /** @type {Map<String,NPC>} */
    NPCs = new Map();
    
    /**
     * @param {Grid} grid
     * @param {IONpcsOptions[]} npcs
     */
    constructor (grid, npcs) {

        this.#grid = grid;
        this.applyOptions( npcs );

    }

    /**
     * @param {IONpcsOptions[]} npcs 
     */
    applyOptions ( npcs ) {
        
        // Remove existing NPCs
        for ( let npc of this.NPCs.values() ) {
            this.removeNPC( npc.agent.identity.id );
        }

        // Create new NPCs
        for ( let npc of npcs ) {
            for ( let i = 0; i < (npc.count || 1); i++ ) {
                this.createNPC(npc);
            }
        }

    }

    /**
     * Add a new NPC
     * @param {IONpcsOptions} options 
     * @returns {NPC} NPC id
     */
    createNPC ( options ) {
        let NPC = new randomlyMovingAgent( options );
        this.NPCs.set( NPC.agent.identity.id, NPC );
        this.#grid.emitter.onAgent( "deleted" , (ev, agent) => {
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
            NPC.agent.delete();
        }
    }

}



export default NPCspawner;
