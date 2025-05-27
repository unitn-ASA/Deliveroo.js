const express = require('express');
const router = express.Router();
const { myGrid } = require('../grid');
const { authorizeAdmin } = require('../middlewares/token');



// GET /agents get the list of all the agents on the grid
router.get('/', async (req, res) => {

    console.log( `GET /api/agents` );

    const agents = Array.from( await myGrid.agents.values() ).map( agent => {
        return {
            id: agent.id,
            name: agent.name,
            teamId: agent.teamId,
            teamName: agent.teamName,
            score: agent.score,
            penalty: agent.penalty
        };
    });
    res.status(200).json( agents );
  
});



// DELETE /agents/:id delete an agent from the grid
router.delete('/:id', authorizeAdmin, async (req, res) => {

    console.log( `DELETE /api/agents/${req.params.id}` );

    const id = req.params.id;
    const agent = myGrid.agents.get( id );
    if ( agent ) {
        myGrid.deleteAgent( agent );
        res.status(200).json( { message: `Agent ${id} deleted` } );
    } else {
        res.status(404).json( { message: `Agent ${id} not found` } );
    }
  
});



// PATCH /agents/:id update an agent's score
router.patch('/:id', authorizeAdmin, async (req, res) => {

    console.log( `PATCH /api/agents/${req.params.id}` );

    const id = req.params.id;
    const agent = myGrid.agents.get( id );
    if ( agent ) {
        if ( req.body.score !== undefined || req.body.penalty !== undefined ) {
            agent.score = req.body.score;
            agent.penalty = req.body.penalty;
            res.status(200).json( { message: `Agent ${id} updated`, score: agent.score, penalty: agent.penalty } );
        } else {
            res.status(400).json( { message: `Score or penalty not provided` } );
        }
    } else {
        res.status(404).json( { message: `Agent ${id} not found` } );
    }
  
});



module.exports = router;
