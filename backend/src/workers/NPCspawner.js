const Grid = require('../deliveroo/Grid');
const config = require('../../config');
const randomlyMovingAgent = require('./RandomlyMovingNPC');
const NPC = require('./NPC');
const myClock = require('../myClock');



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
     */
    constructor (grid) {

        this.#grid = grid;


        myClock.on( '2s', () => {

            while ( this.NPCs.size != config.RANDOMLY_MOVING_AGENTS ) {
                
                if ( this.NPCs.size < config.RANDOMLY_MOVING_AGENTS ) {
                    this.createNPC();
                }
                
                else if ( this.NPCs.size > config.RANDOMLY_MOVING_AGENTS ) {
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
        let NPC = new randomlyMovingAgent( this.#grid );
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



module.exports = NPCspawner;
