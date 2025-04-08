const express = require('express');
const router = express.Router();
const { myGrid } = require('../grid');



// GET /agents get the list of all the agents on the grid
router.get('/', async (req, res) => {

    console.log( `GET /api/agents` );

    const agents = Array.from( await myGrid.agents.values() ).map( agent => {
        return {
            id: agent.id,
            name: agent.name
        };
    });
    res.status(200).json( agents );
  
});



// DELETE /agents/:id delete an agent from the grid
router.delete('/:id', async (req, res) => {

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





module.exports = router;
