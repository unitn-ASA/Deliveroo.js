import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';
import { getLevelsList, loadLevel } from '../levels.js';

const router = express.Router();

// Get levels directory path (internal use only for file operations)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const LEVELS_DIR = path.resolve(__dirname, '..', '..', 'resources', 'levels');

// GET all levels
router.get('/', async (req, res) => {
    console.log(`GET /api/content/levels`);

    try {
        const levelNames = getLevelsList();
        const levels = [];

        for (const name of levelNames) {
            try {
                const level = {
                    self: '/api/content/levels/' + name,
                    name: name
                };
                const mod = await loadLevel(name);
                Object.assign(level, mod);
                levels.push(level);
            } catch (err) {
                console.error(`GET /content/levels Error while reading file ${name}:`, err);
            }
        }

        res.json(levels);
    } catch (err) {
        console.error('GET /content/levels Error while reading directory:', err);
        res.status(500).send('Error while reading directory');
    }
});

// POST level (upload, requires auth - handled by parent)
router.post('/', async (req, res) => {
    const levelData = req.body;
    const { levelName } = req.body;

    console.log(`POST /api/content/levels - Creating or updating level: ${levelName}`);

    if (!levelName) {
        res.status(400).send('Missing levelName in request body');
        return;
    }

    const filePath = path.join(LEVELS_DIR, `${levelName}.js`);

    try {
        const fileContent = `export default ${JSON.stringify(levelData, null, 4)};`;
        fs.writeFileSync(filePath, fileContent, 'utf8');
        console.log(`Level ${levelName} saved successfully.`);
        res.status(201).send(`Level ${levelName} created or updated successfully`);
    } catch (err) {
        console.error(`POST /content/levels Error while saving level:`, err);
        res.status(500).send('Error while saving level');
    }
});

// GET specific level
router.get('/:levelName', async (req, res) => {
    const levelName = req.params.levelName;

    console.log(`GET /api/content/levels/${levelName}`);

    const level = {
        self: '/api/content/levels/' + levelName,
        name: levelName
    };

    try {
        const mod = await loadLevel(levelName);
        Object.assign(level, mod);
        res.json(level);
    } catch (err) {
        console.error(`GET /content/levels/:${levelName} Error while reading file`);
        res.status(404).send(`Level ${levelName} not found`);
    }
});

export default router;
