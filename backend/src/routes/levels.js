const fs = require('fs');
const path = require('path');
const express = require('express');
const router = express.Router();

// GET /all levels
router.get('/', async (req, res) => {

    console.log(`GET /api/levels`);

    // load all .js files from levels directory
    fs.readdir( './levels', (err, files) => {
        if (err) {
            console.error('GET /levels Error while reading directory:', err);
            res.status(500).send('Error while reading directory');
            return;
        }
        const levelsFileNames = files.filter( file => path.extname(file) === '.js' );

        const levels = [];
        // read each file
        levelsFileNames.forEach( (name, index) => {
            try {
                const level = { self: '/api/levels/' + name };
                level.LEVEL = './levels/' + name; // add LEVEL property to the level object
                // copy everything in file object
                Object.assign( level, require( '../../levels/' + name ) );
                levels.push( level );
            } catch (err) {
                console.error('GET /levels Error while reading file:', err);
            }
        });
        
        res.json(levels);
    } );

} )

// POST /levels
router.post('/', async (req, res) => {
    const levelData = req.body;
    const { levelName } = req.body;

    console.log(`POST /api/levels - Creating or updating level: ${levelName}`);

    if ( ! levelName ) {
        res.status(400).send('Missing levelName in request body');
        return;
    }

    const filePath = path.join(__dirname, '../../levels', `${levelName}.js`);

    try {
        // Write file
        const fileContent = `module.exports = ${JSON.stringify(levelData, null, 4)};`;
        fs.writeFileSync(filePath, fileContent, 'utf8');
        console.log(`Level ${levelName} saved successfully.`);
        res.status(201).send(`Level ${levelName} created or updated successfully`);
    } catch (err) {
        console.error(`POST /levels Error while saving level:`, err);
        res.status(500).send('Error while saving level');
    }
} );

// GET /levels/:levelName
router.get('/:levelName', async (req, res) => {
    const levelName = req.params.levelName;

    console.log(`GET /api/levels/${levelName}`);
    
    const level = { self: '/api/levels/' + levelName };
    level.LEVEL = levelName; // add LEVEL property to the level object
    try {
        // load and copy everything in the level
        Object.assign( level, require( '../../levels/' + levelName + '.js' ) );
        res.json(level);
    } catch (err) {
        try {
            Object.assign( level, require( '../../levels/' + levelName ) );
            res.json(level);
        } catch (err) {
            console.error(`GET /levels/:${levelName} Error while reading file`);
            res.status(404).send(`Level ${levelName} not found`);
        }
    }

} )

module.exports = router;
