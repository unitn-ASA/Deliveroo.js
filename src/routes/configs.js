const express = require('express');
const router = express.Router();
const config = require('../../config');

// GET /configs 
router.get('/', async (req, res) => {
    
    console.log(`GET /configs`)
    res.status(200).json( config );

})

router.patch('/', async (req, res) => {
    
    console.log(`PATCH /configs`)
    if ( config.LEVEL != req['LEVEL'] ) {
        config.LEVEL = req['LEVEL'];
        config.loadLevel();
    }
    Object.assign( config, req.body );
    res.status(200).json( config );

})

module.exports = router;
