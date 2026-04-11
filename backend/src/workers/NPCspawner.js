import Grid from '../deliveroo/Grid.js';
import randomlyMovingAgent from './RandomlyMovingNPC.js';
import IntelligentParcelNPC from './IntelligentParcelNPC.js';
import NPC from './NPC.js';


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
    async applyOptions ( npcs ) {
        
        // Remove existing NPCs
        for ( let npcOptions of this.NPCs.values() ) {
            console.log(`Removing existing NPC ${npcOptions.agent.name}`);
            await npcOptions.agent.delete();
        }

        // Create new NPCs
        for ( let npcOptions of npcs ) {
            for ( let i = 0; i < (npcOptions.count || 0); i++ ) {
                let npcAgent = this.createNPC(npcOptions);
                // console.log(`Created NPC i=${i} type=${npcOptions.type} name=${npcAgent.agent.name || 'unnamed'}`);
            }
        }

    }

    /**
     * Add a new NPC
     * @param {IONpcsOptions} options
     * @returns {NPC} NPC id
     */
    createNPC ( options ) {

        let npc;
        // Instantiate the NPC class with the provided options
        switch ( options.type ) {
            case 'random':
                npc = new randomlyMovingAgent( options );
                break;
            case 'intelligent':
                npc = new IntelligentParcelNPC( options );
                break;
            default:
                console.warn(`Unknown NPC type '${options.type}', defaulting to randomlyMoving`);
                npc = new randomlyMovingAgent( options );
        }

        // Store the NPC instance in the NPCs map with the agent id as the key
        const id = npc.agent.identity.id;
        this.NPCs.set( id, npc );

        // Listen for the 'deleted' event on the NPC's agent to remove it from the NPCs map and perform cleanup
        npc.agent.emitter.once( 'deleted', async () => {
            this.NPCs.delete( id );
            await npc.stop();
        } );

        // Start the NPC's behavior
        npc.start();

        return npc;
    }

}



export default NPCspawner;
