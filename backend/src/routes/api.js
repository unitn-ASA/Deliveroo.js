import express from 'express';
import fs from 'fs';
const router = express.Router();

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
        
        console.log( 'api.js Version', packageVersion, 'has been read from package.json file' );
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
                console.log( 'api.js Git commit hash', commitHash, 'has been read from .git-revision file' );
        } catch (error) {
            console.warn('api.js No .git-revision file to read git commit hash');
        }
        
        res( commitHash );

    } )
);

/**
 * @swagger
 * /api/:
 *   get:
 *     summary: Get the status of the game
 *     description: Returns the current status of the game including version and git commit.
 *     tags: [General]
 *     responses:
 *       200:
 *         description: Game status retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 commitHash:
 *                   type: string
 *                   description: Git commit hash
 *                 packageVersion:
 *                   type: string
 *                   description: Package version
 */
// GET /api
router.get('/', async (req, res) => {

    console.log(`GET /api`);

    res.status(200).json( {
        message: 'Welcome to the API',
        commitHash: await commitHash,
        packageVersion: await packageVersion
    } );

})

export default router;
