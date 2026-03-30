import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createCanvas } from 'canvas';
import { getGamesList, loadGame } from '../games.js';

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
                /** @type {import('../games.js').IOGameOptions & {self: string, png: string}} */
                const gameData = {
                    self: '/api/games/' + gameName,
                    png: '/api/games/' + gameName + '.png',
                    title: null,
                    description: null,
                    map: null,
                    maxPlayers: null,
                    npcs: [],
                    parcels: null,
                    player: null
                };
                Object.assign(gameData, await loadGame(gameName));
                gameData.map.width = gameData.map.tiles.length;
                gameData.map.height = gameData.map.tiles[0].length;
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

// Get a specific game as a json (eg /games/1)
router.get('/:gameName', async (req, res) => {
    const gameName = req.params.gameName;

    try {
        /** @type {import('../games.js').IOGameOptions & {self: string, png: string}} */
        const gameData = {
            self: '/api/games/' + gameName,
            png: '/api/games/' + gameName + '.png',
            title: null,
            description: null,
            map: null,
            maxPlayers: null,
            npcs: [],
            parcels: null,
            player: null
        };
        Object.assign(gameData, await loadGame(gameName));
        gameData.map.width = gameData.map.tiles.length;
        gameData.map.height = gameData.map.tiles[0].length;
        res.json(gameData);
    } catch (err) {
        console.error(err);
        res.status(404).send('Game not found. Error: ' + err);
    }
});



const DOT_PER_TILE = 10;
const PADDING = 1;

// Generate png from game
function generatePng(matrix) {
    const width = matrix.length;
    const height = matrix[0].length;

    // console.log(`Generating PNG: ${width}x${height} from matrix`, matrix);

    const canvas = createCanvas(width * DOT_PER_TILE, height * DOT_PER_TILE);
    const ctx = canvas.getContext('2d');

    // fill background
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#252f3dff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    for (let x = 0; x < width; x++) {
        for (let y = 0; y < height; y++) {
            let value = '0';
            try {
                value = ( matrix[x][y] ).toString();
            } catch (err) {
                console.error('routes/games.js generatePng() Error accessing matrix at', x, y, ':', err);
            }

            // Handle directional tiles (Unicode arrows)
            const directionalTiles = ['↑', '→', '↓', '←'];
            const isDirectional = directionalTiles.includes(String(value));

            // Default opacity
            ctx.globalAlpha = 1;
            if (isDirectional) {
                ctx.fillStyle = '#3b82f6';
                ctx.globalAlpha = 0.8;
            } else if (value == '0') {
                ctx.fillStyle = 'grey';
                ctx.globalAlpha = 0.1;
            } else if (value == '1') {
                ctx.fillStyle = 'green';
            } else if (value == '2') {
                ctx.fillStyle = 'red';
            } else if (value == '3') {
                ctx.fillStyle = 'lightgray';
            } else if (value == '5' || value == '5!') {
                ctx.fillStyle = 'yellow';
            } else {
                ctx.fillStyle = 'purple';
            }

            const _left = x * DOT_PER_TILE + PADDING;
            const _top = (height - 1 - y) * DOT_PER_TILE + PADDING;
            const _width = DOT_PER_TILE - 2 * PADDING;
            const _height = DOT_PER_TILE - 2 * PADDING;

            ctx.fillRect(_left, _top, _width, _height);

            // Draw arrow for directional tiles
            if (isDirectional) {
                ctx.fillStyle = 'black';
                ctx.font = '8px Arial';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(value, _left + _width / 2, _top + _height / 2);
            }

            // Draw 'C' for crate spawning tiles
            if (value.endsWith('!')) {
                ctx.fillStyle = 'black';
                ctx.font = '8px Arial';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText('C', _left + _width / 2, _top + _height / 2);
            }
        }
    }

    return canvas.toBuffer("image/png");
}

// Save png on file
function savePng(gameName, buffer) {
    const gamePath = path.join(GAMES_DIR, `${gameName}.png`);
    fs.writeFileSync(gamePath, buffer);
}

export default router;
