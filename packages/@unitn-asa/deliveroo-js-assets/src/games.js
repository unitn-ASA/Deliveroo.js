import path from 'path';
import { fileURLToPath } from 'url';
import { readFile, readFileSync, readdirSync } from 'fs';
import { parseClockEvent } from '@unitn-asa/deliveroo-js-sdk/types/IOClockEvent.js';
import { validateGameOptions } from './validation.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const GAMES_DIR = path.resolve(__dirname, '..', 'assets', 'games');



/** @typedef {import('@unitn-asa/deliveroo-js-sdk/types/IOGameOptions.js').IOGameOptions} IOGameOptions */

/**
 * @typedef {Object} ValidationError
 * @property {string} message - Error message
 * @property {string} [path] - JSON path to the error
 * @property {string} [property] - Property name that failed validation
 * @property {any} [value] - Invalid value
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
 * Validate a game configuration object
 * @param {any} game - Game configuration to validate
 * @returns {ValidationResult} Validation result
 */
export function validateGame(game) {
    return validateGameOptions(game);
}

/**
 * Parse and validate a JSON string as game options
 * @param {string} json - JSON string to parse
 * @param {boolean} [strict=true] - Whether to throw on validation errors
 * @returns {IOGameOptions} Parsed and validated game options
 * @throws {Error} If JSON parsing fails or validation fails (in strict mode)
 */
export function parseJson(json, strict = true) {
    let parsed;
    try {
        parsed = JSON.parse(json, (key, value) => {
            // Convert event string into IOClockEvent
            if (key === 'moving_event' || key === 'generation_event' || key === 'decading_event') {
                return parseClockEvent(value);
            }
            return value;
        });
    } catch (error) {
        const errorMsg = `Error parsing JSON string: ${error.message}`;
        console.error(errorMsg);
        if (strict) {
            throw new Error(errorMsg);
        }
        return null;
    }

    // Validate the parsed game options
    const validationResult = validateGameOptions(parsed);

    if (!validationResult.valid) {
        const errorMsg = `Invalid game configuration:\n${validationResult.getErrorMessage()}`;
        console.error(errorMsg);
        if (strict) {
            throw new Error(errorMsg);
        }
    }

    return parsed;
}

/**
 * Load a game by name
 * @function loadGame
 * @param {string} gameName - Name of the game (with or without .json extension)
 * @param {boolean} [strict=true] - Whether to throw on validation errors
 * @returns {Promise<IOGameOptions>} The game configuration object
 * @throws {Error} If file reading fails or validation fails (in strict mode)
 */
export async function loadGame(gameName, strict = true) {
    if (!gameName.endsWith('.json')) {
        gameName = gameName + '.json';
    }
    const gamePath = path.join(GAMES_DIR, gameName);
    return new Promise((resolve, reject) => {
        readFile(gamePath, 'utf-8', (err, data) => {
            if (err) {
                reject(new Error(`Error reading game file ${gamePath}: ${err.message}`));
            } else {
                try {
                    const parsed = parseJson(data, strict);
                    resolve(parsed);
                } catch (parseError) {
                    reject(parseError);
                }
            }
        });
    });
}

/**
 * Load a game synchronously by name
 * @function loadGameSync
 * @param {string} gameName - Name of the game (with or without .json extension)
 * @param {boolean} [strict=true] - Whether to throw on validation errors
 * @returns {IOGameOptions} The game configuration object
 * @throws {Error} If file reading fails or validation fails (in strict mode)
 */
export function loadGameSync(gameName, strict = true) {
    if (!gameName.endsWith('.json')) {
        gameName = gameName + '.json';
    }
    const gamePath = path.join(GAMES_DIR, gameName);

    try {
        const data = readFileSync(gamePath, 'utf-8');
        return parseJson(data, strict);
    } catch (err) {
        if (strict) {
            throw new Error(`Error reading game file ${gamePath}: ${err.message}`);
        }
        return null;
    }
}
