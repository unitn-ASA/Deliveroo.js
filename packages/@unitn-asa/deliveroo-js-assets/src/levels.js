import path from 'path';
import { fileURLToPath } from 'url';
import { readdirSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const LEVELS_DIR = path.resolve(__dirname, '..', 'resources', 'levels');

/**
 * Get list of available level names
 * @returns {string[]} Array of level names (without .js extension)
 */
export function getLevelsList() {
    const files = readdirSync(LEVELS_DIR);
    return files
        .filter(file => file.endsWith('.js'))
        .map(file => file.replace('.js', ''));
}

/**
 * Load a level by name
 * @param {string} levelName - Name of the level (with or without .js extension)
 * @returns {Promise<Object>} The level configuration object
 */
export async function loadLevel(levelName) {
    if (!levelName.endsWith('.js')) {
        levelName = levelName + '.js';
    }
    const levelPath = path.join(LEVELS_DIR, levelName);
    const levelModule = await import('file://' + levelPath);
    return levelModule.default ?? levelModule;
}
