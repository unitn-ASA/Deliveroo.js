import express from 'express';
import path from 'path';
import config from '../../config.js';
import { myGrid } from '../grid.js';
import { authorizeAdmin } from '../middlewares/token.js';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const mapsDirectory = path.resolve(__dirname, '..', '..', 'levels', 'maps');

const router = express.Router();



// GET /configs 
router.get('/', async (req, res) => {
    
    console.log(`GET /api/configs`)
    res.status(200).json( config );

})

router.patch('/', authorizeAdmin, async (req, res) => {
    
    console.log(`PATCH /configs`, req.body);

    // if changed, update configs from LEVEL file
    if ( req.body.LEVEL && config.LEVEL != req.body.LEVEL ) {
        const js = await config.loadJavascript( req.body.LEVEL );
        console.log(`PATCH /configs: loaded level ${req.body.LEVEL}:`, js);
    }

    // if changed, load MAP_FILE into myGrid
    if ( req.body.MAP_FILE && config.MAP_FILE != req.body.MAP_FILE ) {
        try {
            // resolve map relative to backend folder
            const mapPath = path.join(mapsDirectory, req.body.MAP_FILE + '.js');
            const mod = await import('file://' + mapPath);
            const map = mod.default ?? mod;
            myGrid.loadMap(map);
            console.log(`PATCH /configs: loaded map ${req.body.MAP_FILE}`);
        } catch (error) {
            console.error(`PATCH /configs: cannot load map ${req.body.MAP_FILE}`, error);
        }
    }
    
    // process PLUGINS string into array
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

    // Lazily import ioServer to avoid circular dependencies
    const { default: ioServer } = await import('../ioServer.js');
    ioServer.emit('config', config);
    
    res.status(200).json( config );

})

export default router;
