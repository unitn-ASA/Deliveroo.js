import fs from 'fs';
import path from 'path';
import express from 'express';
import { fileURLToPath } from 'url';

const router = express.Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const levelsDirectory = path.resolve(__dirname, '..', '..', 'levels');



// GET /all levels
router.get('/', async (req, res) => {

    console.log(`GET /api/levels`);

    // load all .js files from levels directory (relative to backend folder)
    fs.readdir(levelsDirectory, async (err, files) => {
        if (err) {
            console.error('GET /levels Error while reading directory:', err);
            res.status(500).send('Error while reading directory');
            return;
        }
        const levelsFileNames = files.filter( file => path.extname(file) === '.js' );

        const levels = [];
        // read each file
        for (const name of levelsFileNames) {
            try {
                const level = { self: '/api/levels/' + name };
                level.LEVEL = './levels/' + name;
                const filePath = path.join(levelsDirectory, name);
                // dynamic import and prefer default export
                const mod = await awaitImportFile(filePath);
                Object.assign(level, mod);
                levels.push(level);
            } catch (err) {
                console.error('GET /levels Error while reading file:', err);
            }
        };
        
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

    const filePath = path.join(levelsDirectory, `${levelName}.js`);

    try {
        // Write file
    const fileContent = `export default ${JSON.stringify(levelData, null, 4)};`;
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
        const filePath = path.join(levelsDirectory, `${levelName}.js`);
        const mod = await import('file://' + filePath);
        Object.assign(level, mod.default ?? mod);
        res.json(level);
    } catch (err) {
        try {
            const filePath = path.join(levelsDirectory, levelName);
            const mod = await import('file://' + filePath);
            Object.assign(level, mod.default ?? mod);
            res.json(level);
        } catch (err) {
            console.error(`GET /levels/:${levelName} Error while reading file`);
            res.status(404).send(`Level ${levelName} not found`);
        }
    }

} )

async function awaitImportFile(filePath) {
    try {
        const mod = await import('file://' + filePath);
        return mod.default ?? mod;
    } catch (err) {
        console.error('Error importing file', filePath, err);
        throw err;
    }
}

export default router;
