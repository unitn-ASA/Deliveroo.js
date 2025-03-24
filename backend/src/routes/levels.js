const fs = require('fs');
const path = require('path');
const express = require('express');
const router = express.Router();

// GET /all levels
router.get('/', async (req, res) => {

    console.log(`GET /levels`);

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

// GET /levels/:levelName
router.get('/:levelName', async (req, res) => {
    const levelName = req.params.levelName;

    console.log(`GET /levels/${levelName}`);
    
    const level = { self: '/api/levels/' + levelName };
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
