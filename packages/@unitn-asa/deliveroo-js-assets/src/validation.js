/**
 * Validation module for game configuration
 * @module validation
 */



/**
 * Valid clock event values
 * @type {readonly string[]}
 */
export const VALID_CLOCK_EVENTS = ['frame', '1s', '2s', '5s', '10s', 'infinite'];

/**
 * Valid tile type values
 * @type {readonly string[]}
 */
export const VALID_TILE_TYPES = ['0', '1', '2', '3', '4', '5', '5!', '←', '↑', '→', '↓'];

/**
 * Valid NPC types
 * @type {readonly string[]}
 */
export const VALID_NPC_TYPES = ['random', 'collector', 'intelligent'];

/**
 * ValidationError class for structured error reporting
 * @property {string} message - Error message
 * @property {string} [path] - JSON path to the error
 * @property {string} [property] - Property name that failed validation
 * @property {any} [value] - Invalid value
 * @property {string} [constraint] - Constraint that was violated
 */
export class ValidationError {
    /**
     * @param {string} message - Error message
     * @param {string} [path] - JSON path to the error
     * @param {string} [property] - Property name that failed validation
     * @param {any} [value] - Invalid value
     * @param {string} [constraint] - Constraint that was violated
     */
    constructor(message, path, property, value, constraint) {
        this.message = message;
        this.path = path;
        this.property = property;
        this.value = value;
        this.constraint = constraint;
    }

    /**
     * @returns {string} Formatted error message
     */
    toString() {
        let msg = this.message;
        if (this.path) {
            msg += ` (path: ${this.path})`;
        }
        if (this.value !== undefined) {
            msg += ` (value: ${JSON.stringify(this.value)})`;
        }
        return msg;
    }
}

/**
 * ValidationResult class for collecting validation errors
 * @property {boolean} valid - Whether validation passed
 * @property {ValidationError[]} [errors] - Array of validation errors
 */
export class ValidationResult {
    /** @param {ValidationError[]} [errors=[]] */
    constructor(errors = []) {
        this.errors = errors;
        /** @type {boolean} */
        this.valid = errors.length === 0;
    }

    /**
     * Add an error to the validation result
     * @param {string} message - Error message
     * @param {string} [path] - JSON path to the error
     * @param {any} [value] - Invalid value
     */
    addError(message, path, value) {
        this.errors.push(new ValidationError(message, path, undefined, value));
        this.valid = false;
    }

    /**
     * Merge another validation result into this one
     * @param {ValidationResult} other - Another validation result
     */
    merge(other) {
        this.errors.push(...other.errors);
        this.valid = this.valid && other.valid;
    }

    /**
     * Get a formatted error message
     * @returns {string} Formatted error message
     */
    getErrorMessage() {
        if (this.valid) {
            return 'Validation passed';
        }
        return 'Validation failed:\n' + this.errors.map(e => `  - ${e.toString()}`).join('\n');
    }
}

/**
 * Validate a clock event value
 * @param {any} value - Value to validate
 * @param {string} path - JSON path to the value
 * @returns {ValidationResult} Validation result
 */
export function validateClockEvent(value, path) {
    const result = new ValidationResult();
    if (typeof value !== 'string') {
        result.addError(`Clock event must be a string, got ${typeof value}`, path, value);
    } else if (!VALID_CLOCK_EVENTS.includes(value)) {
        result.addError(`Invalid clock event '${value}'. Must be one of: ${VALID_CLOCK_EVENTS.join(', ')}`, path, value);
    }
    return result;
}

/**
 * Validate and normalize a tile type value
 * @param {any} value - Value to validate
 * @param {string} path - JSON path to the value
 * @returns {ValidationResult} Validation result
 */
export function validateTileType(value, path) {
    const result = new ValidationResult();
    // Convert number to string for validation (existing JSON files use numbers)
    const valueStr = String(value);
    if (!VALID_TILE_TYPES.includes(valueStr)) {
        result.addError(`Invalid tile type '${value}'. Must be one of: ${VALID_TILE_TYPES.join(', ')}`, path, value);
    }
    return result;
}

/**
 * Validate NPC type value
 * @param {any} value - Value to validate
 * @param {string} path - JSON path to the value
 * @returns {ValidationResult} Validation result
 */
export function validateNpcType(value, path) {
    const result = new ValidationResult();
    if (typeof value !== 'string') {
        result.addError(`NPC type must be a string, got ${typeof value}`, path, value);
    } else if (!VALID_NPC_TYPES.includes(value)) {
        result.addError(`Invalid NPC type '${value}'. Must be one of: ${VALID_NPC_TYPES.join(', ')}`, path, value);
    }
    return result;
}

/**
 * Validate a positive number
 * @param {any} value - Value to validate
 * @param {string} path - JSON path to the value
 * @param {number} [min=0] - Minimum value (inclusive)
 * @returns {ValidationResult} Validation result
 */
export function validatePositiveNumber(value, path, min = 0) {
    const result = new ValidationResult();
    if (typeof value !== 'number') {
        result.addError(`Must be a number, got ${typeof value}`, path, value);
    } else if (!Number.isFinite(value)) {
        result.addError(`Must be a finite number`, path, value);
    } else if (value < min) {
        result.addError(`Must be >= ${min}, got ${value}`, path, value);
    }
    return result;
}

/**
 * Validate a string
 * @param {any} value - Value to validate
 * @param {string} path - JSON path to the value
 * @param {boolean} [required=false] - Whether the string is required
 * @returns {ValidationResult} Validation result
 */
export function validateString(value, path, required = false) {
    const result = new ValidationResult();
    if (value === undefined || value === null) {
        if (required) {
            result.addError(`Required string is missing`, path, value);
        }
    } else if (typeof value !== 'string') {
        result.addError(`Must be a string, got ${typeof value}`, path, value);
    }
    return result;
}

/**
 * Validate an array
 * @param {any} value - Value to validate
 * @param {string} path - JSON path to the value
 * @param {boolean} [required=false] - Whether the array is required
 * @returns {ValidationResult} Validation result
 */
export function validateArray(value, path, required = false) {
    const result = new ValidationResult();
    if (value === undefined || value === null) {
        if (required) {
            result.addError(`Required array is missing`, path, value);
        }
    } else if (!Array.isArray(value)) {
        result.addError(`Must be an array, got ${typeof value}`, path, value);
    }
    return result;
}

/**
 * Validate an object
 * @param {any} value - Value to validate
 * @param {string} path - JSON path to the value
 * @param {boolean} [required=false] - Whether the object is required
 * @returns {ValidationResult} Validation result
 */
export function validateObject(value, path, required = false) {
    const result = new ValidationResult();
    if (value === undefined || value === null) {
        if (required) {
            result.addError(`Required object is missing`, path, value);
        }
    } else if (typeof value !== 'object' || Array.isArray(value)) {
        result.addError(`Must be an object, got ${typeof value}`, path, value);
    }
    return result;
}

/**
 * Validate IOMapOptions
 * @param {any} map - Map options to validate
 * @param {string} [path='map'] - JSON path to the map
 * @returns {ValidationResult} Validation result
 */
export function validateMapOptions(map, path = 'map') {
    const result = new ValidationResult();

    const objectResult = validateObject(map, path, true);
    if (!objectResult.valid) {
        return objectResult;
    }

    // Validate width
    const widthResult = validatePositiveNumber(map.width, `${path}.width`, 1);
    result.merge(widthResult);

    // Validate height
    const heightResult = validatePositiveNumber(map.height, `${path}.height`, 1);
    result.merge(heightResult);

    // Validate tiles
    if (!Array.isArray(map.tiles)) {
        result.addError('Map tiles must be a 2D array', `${path}.tiles`, map.tiles);
    } else {
        // Check that tiles is a 2D array
        const is2DArray = map.tiles.every(row => Array.isArray(row));
        if (!is2DArray) {
            result.addError('Map tiles must be a 2D array', `${path}.tiles`, map.tiles);
        } else {
            // Check dimensions match width/height
            if (map.tiles.length !== map.height) {
                result.addError(`Map tiles height (${map.tiles.length}) does not match specified height (${map.height})`, `${path}.tiles`, map.tiles.length);
            }
            for (let i = 0; i < map.tiles.length; i++) {
                if (map.tiles[i].length !== map.width) {
                    result.addError(`Map tiles row ${i} width (${map.tiles[i].length}) does not match specified width (${map.width})`, `${path}.tiles[${i}]`, map.tiles[i].length);
                }
                // Validate each tile type
                for (let j = 0; j < map.tiles[i].length; j++) {
                    const tileResult = validateTileType(map.tiles[i][j], `${path}.tiles[${i}][${j}]`);
                    result.merge(tileResult);
                }
            }
        }
    }

    return result;
}

/**
 * Validate IONpcsOptions
 * @param {any} npcs - NPC options to validate
 * @param {string} [path='npcs'] - JSON path to the npcs
 * @returns {ValidationResult} Validation result
 */
export function validateNpcsOptions(npcs, path = 'npcs') {
    const result = new ValidationResult();

    if (!Array.isArray(npcs)) {
        result.addError('NPCs must be an array', path, npcs);
        return result;
    }

    for (let i = 0; i < npcs.length; i++) {
        const npc = npcs[i];
        const npcPath = `${path}[${i}]`;

        const objectResult = validateObject(npc, npcPath, true);
        if (!objectResult.valid) {
            result.merge(objectResult);
            continue;
        }

        // Validate moving_event
        if (npc.moving_event !== undefined) {
            const eventResult = validateClockEvent(npc.moving_event, `${npcPath}.moving_event`);
            result.merge(eventResult);
        }

        // Validate type
        if (npc.type !== undefined) {
            const typeResult = validateNpcType(npc.type, `${npcPath}.type`);
            result.merge(typeResult);
        }

        // Validate count
        const countResult = validatePositiveNumber(npc.count, `${npcPath}.count`, 0);
        result.merge(countResult);
    }

    return result;
}

/**
 * Validate IOParcelsOptions
 * @param {any} parcels - Parcels options to validate
 * @param {string} [path='parcels'] - JSON path to the parcels
 * @returns {ValidationResult} Validation result
 */
export function validateParcelsOptions(parcels, path = 'parcels') {
    const result = new ValidationResult();

    const objectResult = validateObject(parcels, path, true);
    if (!objectResult.valid) {
        return objectResult;
    }

    // Validate generation_event
    if (parcels.generation_event !== undefined) {
        const genResult = validateClockEvent(parcels.generation_event, `${path}.generation_event`);
        result.merge(genResult);
    }

    // Validate decaying_event
    if (parcels.decaying_event !== undefined) {
        const decResult = validateClockEvent(parcels.decaying_event, `${path}.decaying_event`);
        result.merge(decResult);
    }

    // Validate max
    const maxResult = validatePositiveNumber(parcels.max, `${path}.max`, 0);
    result.merge(maxResult);

    // Validate reward_avg
    const avgResult = validatePositiveNumber(parcels.reward_avg, `${path}.reward_avg`, 0);
    result.merge(avgResult);

    // Validate reward_variance
    const varResult = validatePositiveNumber(parcels.reward_variance, `${path}.reward_variance`, 0);
    result.merge(varResult);

    return result;
}

/**
 * Validate IOPlayerOptions
 * @param {any} player - Player options to validate
 * @param {string} [path='player'] - JSON path to the player
 * @returns {ValidationResult} Validation result
 */
export function validatePlayerOptions(player, path = 'player') {
    const result = new ValidationResult();

    const objectResult = validateObject(player, path, true);
    if (!objectResult.valid) {
        return objectResult;
    }

    // Validate agent_type (optional field)
    if (player.agent_type !== undefined) {
        const agentTypeResult = validateString(player.agent_type, `${path}.agent_type`, false);
        result.merge(agentTypeResult);
    }

    // Validate movement_duration
    const durationResult = validatePositiveNumber(player.movement_duration, `${path}.movement_duration`, 1);
    result.merge(durationResult);

    // Validate observation_distance (-1 represents infinity)
    if (player.observation_distance !== undefined) {
        const obsResult = new ValidationResult();
        if (typeof player.observation_distance !== 'number') {
            obsResult.addError(`Must be a number, got ${typeof player.observation_distance}`, `${path}.observation_distance`, player.observation_distance);
        } else if (!Number.isFinite(player.observation_distance)) {
            obsResult.addError(`Must be a finite number`, `${path}.observation_distance`, player.observation_distance);
        } else if (player.observation_distance < -1) {
            obsResult.addError(`Must be >= -1, got ${player.observation_distance}`, `${path}.observation_distance`, player.observation_distance);
        }
        result.merge(obsResult);
    }

    // Validate capacity (-1 represents infinite capacity)
    if (player.capacity !== undefined) {
        const capacityResult = new ValidationResult();
        if (typeof player.capacity !== 'number') {
            capacityResult.addError(`Must be a number, got ${typeof player.capacity}`, `${path}.capacity`, player.capacity);
        } else if (!Number.isFinite(player.capacity)) {
            capacityResult.addError(`Must be a finite number`, `${path}.capacity`, player.capacity);
        } else if (player.capacity < -1) {
            capacityResult.addError(`Must be >= -1, got ${player.capacity}`, `${path}.capacity`, player.capacity);
        }
        result.merge(capacityResult);
    }

    return result;
}

/**
 * Validate IOGameOptions
 * @param {any} game - Game options to validate
 * @returns {ValidationResult} Validation result
 */
export function validateGameOptions(game) {
    const result = new ValidationResult();

    const objectResult = validateObject(game, 'game', true);
    if (!objectResult.valid) {
        return objectResult;
    }

    // Validate title
    const titleResult = validateString(game.title, 'title', true);
    result.merge(titleResult);

    // Validate description
    const descResult = validateString(game.description, 'description', true);
    result.merge(descResult);

    // Validate map
    if (game.map !== undefined) {
        const mapResult = validateMapOptions(game.map, 'map');
        result.merge(mapResult);
    } else {
        result.addError('Required property "map" is missing', 'map');
    }

    // Validate maxPlayers
    const maxPlayersResult = validatePositiveNumber(game.maxPlayers, 'maxPlayers', 1);
    result.merge(maxPlayersResult);

    // Validate npcs
    if (game.npcs !== undefined) {
        const npcsResult = validateNpcsOptions(game.npcs, 'npcs');
        result.merge(npcsResult);
    }

    // Validate parcels
    if (game.parcels !== undefined) {
        const parcelsResult = validateParcelsOptions(game.parcels, 'parcels');
        result.merge(parcelsResult);
    } else {
        result.addError('Required property "parcels" is missing', 'parcels');
    }

    // Validate player
    if (game.player !== undefined) {
        const playerResult = validatePlayerOptions(game.player, 'player');
        result.merge(playerResult);
    } else {
        result.addError('Required property "player" is missing', 'player');
    }

    return result;
}
