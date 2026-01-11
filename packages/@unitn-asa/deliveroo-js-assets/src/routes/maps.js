import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createCanvas } from 'canvas';
import { getMapList, loadMap } from '../maps.js';

const router = express.Router();

// Get maps directory path (internal use only for PNG saving)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const MAPS_DIR = path.resolve(__dirname, '..', '..', 'resources', 'maps');

// Get all maps as a json
router.get('/', async (req, res) => {
    try {
        const mapNames = getMapList();
        const maps = [];

        for (const mapName of mapNames) {
            try {
                const mapData = await readMapFromJson(mapName);
                if (mapData && mapData.name) {
                    maps.push({
                        self: '/api/content/maps/' + mapData.name,
                        png: '/api/content/maps/' + mapData.name + '.png',
                        name: mapData.name,
                        map: mapData.tiles || mapData.map
                    });
                }
            } catch (err) {
                console.error(`Error reading map ${mapName}:`, err);
            }
        }

        res.json(maps);
    } catch (err) {
        console.error('Error getting maps list:', err);
        res.status(500).send('Error reading maps directory');
    }
});

// Upload a new map (requires auth, handled by parent)
router.post('/', (req, res) => {
    const mapName = req.body.name;
    const mapMap = req.body.map;

    const mapPath = path.join(MAPS_DIR, `${mapName}.json`);

    fs.writeFile(mapPath, JSON.stringify(mapMap, null, 2), (error) => {
        if (error) {
            console.error('Error writing map file:', error);
            res.status(500).send('Error writing map file');
            return;
        }

        res.status(201).send('Map created successfully');
    });
});

// Get a specific map as a png (eg /maps/1.png)
router.get('/:mapName.png', async (req, res) => {
    const mapName = req.params.mapName;

    try {
        const tiles = loadMap(mapName);

        const png = generatePng(tiles);
        savePng(mapName, png);

        res.contentType('image/png');
        res.send(png);

    } catch (err) {
        console.error(err);
        res.status(404).send('Map not found. Error: ' + err);
    }
});

// Get a specific map as a json (eg /maps/1)
router.get('/:mapName', async (req, res) => {
    const mapName = req.params.mapName;

    try {
        const mapData = await readMapFromJson(mapName);
        res.json(mapData);
    } catch (err) {
        console.error(err);
        res.status(404).send('Map not found. Error: ' + err);
    }
});

// Read map from json file (returns full map metadata)
async function readMapFromJson(mapName) {
    if (mapName.split('.').pop() != 'json') {
        mapName = mapName + '.json';
    }

    const jsonPath = path.join(MAPS_DIR, mapName);
    const data = fs.readFileSync(jsonPath, 'utf8');
    const map = JSON.parse(data);

    if (!map.name) {
        throw new Error("Invalid map json file " + jsonPath);
    }

    // Use loadMap to get tiles
    map.tiles = loadMap(mapName);
    return map;
}

// Read map png file
function readMapFromPng(mapName) {
    const pngPath = path.join(MAPS_DIR, `${mapName}.png`);
    return new Promise((resolve, reject) => {
        fs.readFile(pngPath, (err, data) => {
            if (err) {
                resolve(null);
                return;
            }
            resolve(data);
        });
    });
}

const DOT_PER_TILE = 10;
const PADDING = 1;

// Generate png from map
function generatePng(matrix) {
    const width = matrix[0].length;
    const height = matrix.length;

    const canvas = createCanvas(width * DOT_PER_TILE, height * DOT_PER_TILE);
    const ctx = canvas.getContext('2d');

    for (let x = 0; x < width; x++) {
        for (let y = 0; y < height; y++) {
            let value = matrix[x][y];
            ctx.globalAlpha = 1;

            // Handle directional tiles (Unicode arrows)
            const directionalTiles = ['↑', '→', '↓', '←'];
            const isDirectional = directionalTiles.includes(String(value));

            if (isDirectional) {
                ctx.fillStyle = 'lightblue';
                ctx.globalAlpha = 0.8;
            } else if (value == 0 || value == '0') {
                ctx.fillStyle = 'grey';
                ctx.globalAlpha = 0.1;
            } else if (value == 1 || value == '1') {
                ctx.fillStyle = 'green';
            } else if (value == 2 || value == '2') {
                ctx.fillStyle = 'red';
            } else if (value == 3 || value == '3') {
                ctx.fillStyle = 'lightgreen';
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
        }
    }

    return canvas.toBuffer("image/png");
}

// Save png on file
function savePng(mapName, buffer) {
    const mapPath = path.join(MAPS_DIR, `${mapName}.png`);
    fs.writeFileSync(mapPath, buffer);
}

export default router;
