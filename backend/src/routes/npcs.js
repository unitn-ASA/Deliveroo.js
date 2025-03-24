const express = require('express');
const router = express.Router();
const { myNPCSpawner } = require('../grid');



// GET /npcs get the list of all npcs on the grid
router.get('/', async (req, res) => {

    console.log( `GET /npcs` );

    const agents = Array.from( await myNPCSpawner.NPCs.values() ).map( npc => {
        return {
            id: npc.agent.id,
            name: npc.agent.name,
            agent: npc.agent,
            running: npc.running,
            stopRequested: npc.stopRequested
        };
    });
    res.status(200).json( agents );
  
});



// GET /npcs/:id get the npc with id
router.get('/:id', async (req, res) => {

    console.log( `GET /npcs/${req.params.id}` );

    const npc = myNPCSpawner.NPCs.get( req.params.id );
    if ( npc ) {
        res.status(200).json( {
            id: npc.agent.id,
            name: npc.agent.name,
            agent: npc.agent,
            running: npc.running,
            stopRequested: npc.stopRequested
        } );
    }
    else {
        res.status(404).json( { message: `NPC ${req.params.id} not found` } );
    }
  
});



// PATCH /npcs/:id start or stop the npc with id
router.patch('/:id', async (req, res) => {

    console.log( `PATCH /npcs/${req.params.id}`, req.body );

    const npc = myNPCSpawner.NPCs.get( req.params.id );
    if ( npc ) {
        if ( req.body.running && ! npc.running ) {
            npc.start();
        }
        else if ( req.body.stopRequested && ! npc.stopRequested ) {
            npc.stop();
        }
        res.status(200).json( {
            id: npc.agent.id,
            name: npc.agent.name,
            agent: npc.agent,
            running: npc.running,
            stopRequested: npc.stopRequested
        } );
    }
    else {
        res.status(404).json( { message: `NPC ${req.params.id} not found` } );
    }
  
});



// POST /npcs create a new npc
router.post('/', async (req, res) => {

    console.log( `POST /npcs`, req.body );

    const npc = myNPCSpawner.createNPC();
    res.status(200).json( {
        id: npc.agent.id,
        name: npc.agent.name,
        agent: npc.agent,
        running: npc.running,
        stopRequested: npc.stopRequested
    } );

});



module.exports = router;
