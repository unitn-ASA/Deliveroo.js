const express = require('express');
const router = express.Router();
const fs = require('fs');

const packageVersion = new Promise( res =>
    fs.readFile('./package.json', { encoding: 'utf8'}, (err, data) => {
        
        let packageVersion = 'no package.json';
        
        try {
            if ( err )
                throw err;
            else if ( data )
                packageVersion = JSON.parse(data).version;
        } catch (error) {
            console.error('Error while reading package.json', error);
        }
        
        console.log( 'api.js packageVersion =', 'no package.json' );
        res( packageVersion )
    } )
);

const commitHash = new Promise( res =>
    fs.readFile('./.git-revision', { encoding: 'utf8'}, (err, data) => {

        let commitHash = 'no git';

        try {
            if ( err )
                throw err;
            else if ( data )
                commitHash = data.toString().trim();
        } catch (error) {
            console.error('Error while reading commit hash from .git-revision', error);
        }
        
        console.log( 'api.js commitHash =', commitHash );
        res( commitHash );

    } )
);

// GET /configs 
router.get('/', async (req, res) => {

    console.log(`GET /api`);

    res.status(200).json( {
        message: 'Welcome to the API',
        commitHash: await commitHash,
        packageVersion: await packageVersion
    } );

})

module.exports = router;
