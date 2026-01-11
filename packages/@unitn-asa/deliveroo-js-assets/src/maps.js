import path from 'path';
import { fileURLToPath } from 'url';
import { readFileSync, readdirSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MAPS_DIR = path.resolve(__dirname, '..', 'resources', 'maps');

/**
 * Get list of available map names
 * @returns {string[]} Array of map names (without .json extension)
 */
export function getMapList() {
    const files = readdirSync(MAPS_DIR);
    return files
        .filter(file => file.endsWith('.json'))
        .map(file => file.replace('.json', ''));
}

/**
 * Load a map by name
 * @param {string} mapName - Name of the map (with or without .json extension)
 * @returns {Array} The map tiles array
 */
export function loadMap(mapName) {
    if (!mapName.endsWith('.json')) {
        mapName = mapName + '.json';
    }
    const mapPath = path.join(MAPS_DIR, mapName);
    const mapData = readFileSync(mapPath, 'utf8');
    const parsed = JSON.parse(mapData);
    return parsed.tiles || parsed.map || parsed;
}
