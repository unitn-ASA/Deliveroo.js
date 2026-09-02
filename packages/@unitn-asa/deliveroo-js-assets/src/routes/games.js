import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { getGamesList, loadGame } from '../games.js';
import { generatePng, generateObservationLayer, generateNpcAnimationGif } from '../image-generation.js';

const router = express.Router();

// Get games directory path (internal use only for PNG saving)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const GAMES_DIR = path.resolve(__dirname, '..', '..', 'assets', 'games');

// Get all games as a json
router.get('/', async (req, res) => {
    try {
        const gameNames = getGamesList();
        const games = [];

        for (const gameName of gameNames) {
            try {
                /** @type {import('../games.js').IOGameOptions & {self: string, png: string, layers: {npcs?: string, observation?: string}}} */
                const gameData = {
                    self: '/api/games/' + gameName,
                    png: '/api/games/' + gameName + '.png',
                    layers: {
                        npcs: '/api/games/' + gameName + '/layers/npcs.gif',
                        observation: '/api/games/' + gameName + '/layers/observation.png'
                    },
                    title: null,
                    description: null,
                    map: null,
                    npcs: [],
                    parcels: null,
                    player: null
                };
                Object.assign(gameData, await loadGame(gameName));

                // Remove layer links if not applicable
                if (!gameData.npcs || gameData.npcs.length === 0) {
                    delete gameData.layers.npcs;
                }
                if (!gameData.player?.observation_distance || gameData.player.observation_distance === -1) {
                    delete gameData.layers.observation;
                }
                if (Object.keys(gameData.layers).length === 0) {
                    delete gameData.layers;
                }

                games.push(gameData);
            } catch (err) {
                console.error(`Error reading game ${gameName}:`, err);
            }
        }

        res.json(games);
    } catch (err) {
        console.error('Error getting games list:', err);
        res.status(500).send('Error reading games directory');
    }
});

// Upload a new game (requires auth, handled by parent)
router.post('/', (req, res) => {
    const game = req.body;

    const gamePath = path.join(GAMES_DIR, `${game.title}.json`);

    fs.writeFile(gamePath, JSON.stringify(game.title, null, 2), (error) => {
        if (error) {
            console.error('Error writing game file:', error);
            res.status(500).send('Error writing game file');
            return;
        }

        res.status(201).send('Game created successfully');
    });
});

// Get a specific game as a png (eg /games/1.png)
router.get('/:gameName.png', async (req, res) => {
    const gameName = req.params.gameName;

    try {
        const game = await loadGame(gameName);

        const png = generatePng(game.map.tiles);
        savePng(gameName, png);

        res.contentType('image/png');
        res.send(png);

    } catch (err) {
        console.error(err);
        res.status(404).send('Game not found. Error: ' + err);
    }
});

// Get NPC animation layer (must be before /:gameName route)
router.get('/:gameName/layers/npcs.gif', async (req, res) => {
    const gameName = req.params.gameName;

    try {
        const game = await loadGame(gameName);
        const npcGif = generateNpcAnimationGif(
            game.map.tiles,
            game.npcs,
            game.player.movement_duration
        );

        res.contentType('image/gif');
        res.send(npcGif);

    } catch (err) {
        console.error(err);
        res.status(404).send('NPC layer not found');
    }
});

// Get observation layer (must be before /:gameName route)
router.get('/:gameName/layers/observation.png', async (req, res) => {
    const gameName = req.params.gameName;

    try {
        const game = await loadGame(gameName);
        const obsPng = generateObservationLayer(
            game.map.tiles,
            game.player.observation_distance
        );

        res.contentType('image/png');
        res.send(obsPng);

    } catch (err) {
        console.error(err);
        res.status(404).send('Observation layer not found');
    }
});

// Get a specific game as a json (eg /games/1)
router.get('/:gameName', async (req, res) => {
    const gameName = req.params.gameName;

    try {
        /** @type {import('../games.js').IOGameOptions & {self: string, png: string, layers: {npcs?: string, observation?: string}}} */
        const gameData = {
            self: '/api/games/' + gameName,
            png: '/api/games/' + gameName + '.png',
            layers: {
                npcs: '/api/games/' + gameName + '/layers/npcs.gif',
                observation: '/api/games/' + gameName + '/layers/observation.png'
            },
            title: null,
            description: null,
            map: null,
            npcs: [],
            parcels: null,
            player: null
        };
        Object.assign(gameData, await loadGame(gameName));

        // Remove layer links if not applicable
        if (!gameData.npcs || gameData.npcs.length === 0) {
            delete gameData.layers.npcs;
        }
        if (!gameData.player?.observation_distance || gameData.player.observation_distance === -1) {
            delete gameData.layers.observation;
        }
        if (Object.keys(gameData.layers).length === 0) {
            delete gameData.layers;
        }

        res.json(gameData);
    } catch (err) {
        console.error(err);
        res.status(404).send('Game not found. Error: ' + err);
    }
});


// Save png on file
function savePng(gameName, buffer) {
    const gamePath = path.join(GAMES_DIR, `${gameName}.png`);
    fs.writeFileSync(gamePath, buffer);
}

// Save layer on file
function saveLayer(gameName, layerType, buffer) {
    const extension = layerType === 'npcs' ? 'gif' : 'png';
    const layerPath = path.join(GAMES_DIR, `${gameName}.${layerType}.${extension}`);
    fs.writeFileSync(layerPath, buffer);
}

export default router;
