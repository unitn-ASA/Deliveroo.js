const express = require('express');
const router = express.Router();
const config = require('../../config');
const myGrid = require('../grid');

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
    if ( config.MAP_FILE != req.body['MAP_FILE'] ) {
        config.MAP_FILE = req['MAP_FILE'];
        const map = require( '../../levels/maps/' + req.body['MAP_FILE'] + '.js' );
        myGrid.loadMap( map );
    }
    Object.assign( config, req.body );
    res.status(200).json( config );

})

module.exports = router;
