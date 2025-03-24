const express = require('express');
const router = express.Router();
const { myGrid } = require('../grid');



// GET /agents get the list of all the agents on the grid
router.get('/', async (req, res) => {

    console.log( `GET /agents` );

    const agents = Array.from( await myGrid.agents.values() ).map( agent => {
        return {
            id: agent.id,
            name: agent.name
        };
    });
    res.status(200).json( agents );
  
});





module.exports = router;
