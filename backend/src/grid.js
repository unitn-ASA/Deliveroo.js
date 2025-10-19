import Grid from './deliveroo/Grid.js';
import config from '../config.js';
import ParcelSpawner from './workers/ParcelSpawner.js';
import NPCspawner from './workers/NPCspawner.js';
import path from 'path';
import { fileURLToPath } from 'url';
// ESM-friendly __dirname for stable path resolution
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// resolve map path relative to backend folder
const mapPath = path.join(__dirname, '..', 'levels', 'maps', config.MAP_FILE + '.js');
let mapModule;
try {
	mapModule = await import('file://' + mapPath);
} catch (err) {
	// try without .js (in case MAP_FILE already contains extension)
	mapModule = await import('file://' + path.join(__dirname, '..', 'levels', 'maps', config.MAP_FILE));
}
const map = mapModule.default ?? mapModule;

const myGrid = new Grid(map);
const myParcelSpawner = new ParcelSpawner(myGrid);
const myNPCSpawner = new NPCspawner(myGrid);

export { myGrid, myParcelSpawner, myNPCSpawner };
