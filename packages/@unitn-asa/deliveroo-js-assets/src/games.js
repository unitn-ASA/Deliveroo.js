import path from 'path';
import { fileURLToPath } from 'url';
import { readFile, readFileSync, readdirSync } from 'fs';
import { parseClockEvent } from '@unitn-asa/deliveroo-js-sdk';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const GAMES_DIR = path.resolve(__dirname, '..', 'assets', 'games');



/** @typedef {import('@unitn-asa/deliveroo-js-sdk/types/IOGameOptions.js').IOGameOptions} IOGameOptions */

/**
 * @typedef {Object} ValidationError
 * @property {string} message - Error message
 * @property {string} [path] - JSON path to the error
 * @property {string} [property] - Property name that failed validation
 * @property {string} [value] - Invalid value
 * @property {string} [constraint] - Constraint that was violated
 */

/**
 * @typedef {Object} ValidationResult
 * @property {boolean} valid - Whether validation passed
 * @property {ValidationError[]} [errors] - Array of validation errors
 */



/**
 * Get list of available game names
 * @returns {string[]} Array of game names (without .json extension)
 */
export function getGamesList() {
    try {
        const files = readdirSync(GAMES_DIR);
        return files
            .filter(file => file.endsWith('.json'))
            .map(file => file.replace('.json', ''));
    } catch (err) {
        return [];
    }
}



/**
 * Load a game by name
 * @async
 * @function loadGame
 * @param {string} gameName - Name of the game (with or without .json extension)
 * @returns {Promise<IOGameOptions>} The game configuration object
 */
export async function loadGame(gameName) {
    if (!gameName.endsWith('.json')) {
        gameName = gameName + '.json';
    }
    const gamePath = path.join(GAMES_DIR, gameName);
    return new Promise((resolve, reject) => {
        readFile(gamePath, 'utf-8', (err, data) => {
            if (err) {
                reject(new Error(`Error reading game file ${gamePath}: ${err.message}`));
            } else {
                resolve(parseJson(data));
            }
        });
    });
}



/**
 * @param {String} json 
 * @returns {IOGameOptions}
 */
export function parseJson(json) {
    try {
        return JSON.parse(json, (key, value) => {
            // Convert event string into IOClockEvent
            if (key === 'moving_event' || key === 'generation_event' || key === 'decading_event') {
                return parseClockEvent(value);
            }
            return value;
        });
    } catch (error) {
        console.error('Error parsing JSON string:', error);
        return null;
    }
}
