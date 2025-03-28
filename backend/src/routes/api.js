const express = require('express');
const router = express.Router();
const config = require('../../config');
const { myGrid } = require('../grid');
const { execSync } = require('child_process');
const fs = require('fs');

// GET /configs 
router.get('/', async (req, res) => {

    console.log(`GET /version`)

    const packageVersion = await new Promise( res =>
        fs.readFile('./package.json', { encoding: 'utf8'}, (err, data) => res( JSON.parse(data).version ) )
    );
    
    const commitHash = await new Promise( res =>
        fs.readFile('./.git-revision', { encoding: 'utf8'}, (err, data) => res( data.toString().trim() ) )
    );
    
    res.status(200).json( {
        message: 'Welcome to the API',
        commitHash,
        packageVersion
    } );

})

module.exports = router;
