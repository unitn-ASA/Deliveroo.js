const express = require('express');
const router = express.Router();
const config = require('../../config');
const { myGrid } = require('../grid');
const { authorizeAdmin } = require('../middlewares/token');

// GET /configs 
router.get('/', async (req, res) => {
    
    console.log(`GET /api/configs`)
    res.status(200).json( config );

})

router.patch('/', authorizeAdmin, async (req, res) => {
    
    console.log(`PATCH /configs`, req.body);

    // if changed, update configs from LEVEL file
    if ( req.body.LEVEL && config.LEVEL != req.body.LEVEL ) {
        const js = config.loadJavascript( req.body.LEVEL );
        Object.assign( this, js );
        console.log(`PATCH /configs: loaded level ${req.body.LEVEL}:`, js);
    }

    // if changed, load MAP_FILE into myGrid
    if ( req.body.MAP_FILE && config.MAP_FILE != req.body.MAP_FILE ) {
        try {
            const map = require( '../../levels/maps/' + req.body.MAP_FILE + '.js' );
            myGrid.loadMap( map );
            console.log(`PATCH /configs: loaded map ${req.body.MAP_FILE}`);
        }
        catch (error) {
            console.error(`PATCH /configs: cannot load map ${req.body.MAP_FILE}`, error);
        }
    }
    
    // Split req.body.PLUGINS from spaced text to array
    if ( req.body.PLUGINS && typeof req.body.PLUGINS === 'string'  ) {
        req.body.PLUGINS = req.body.PLUGINS.split(' ');
    }
    
    // if changed, update config.PLUGINS and load plugins
    if ( req.body.PLUGINS && config.PLUGINS != req.body.PLUGINS ) {
        config['PLUGINS'] = req.body['PLUGINS'];
        console.log(`PATCH /configs set PLUGINS =`, req.body['PLUGINS']);
        config.loadPlugins();
        console.log(`PATCH /configs: loaded PLUGINS =`, config.PLUGINS);
    }

    // for each change, update config
    for ( let key in req.body ) {
        if ( config[key] != req.body[key] ) {
            config[key] = req.body[key];
            console.log(`PATCH /configs set ${key} =`, req.body[key]);
        }
    }
    
    
    res.status(200).json( config );

})

module.exports = router;
