import path from 'path';
import { fileURLToPath } from 'url';
import { readFileSync, readdirSync } from 'fs';
import { parseClockEvent } from '@unitn-asa/deliveroo-js-sdk';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const GAMES_DIR = path.resolve(__dirname, '..', 'resources', 'games');
const LEVELS_DIR = path.resolve(__dirname, '..', 'resources', 'levels');



/** @typedef {import('@unitn-asa/deliveroo-js-sdk/src/IOGameOptions').IOGameOptions} IOGameOptions */



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
 * @param {string} gameName - Name of the game (with or without .json extension)
 * @returns {IOGameOptions} The game configuration object
 */
export function loadGame(gameName) {
    if (!gameName.endsWith('.json')) {
        gameName = gameName + '.json';
    }
    const gamePath = path.join(GAMES_DIR, gameName);
    const gameData = readFileSync(gamePath, 'utf8');
    return parseJson(gameData);
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
