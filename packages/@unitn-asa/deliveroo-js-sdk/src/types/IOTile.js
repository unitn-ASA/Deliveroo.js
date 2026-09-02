
/** @type {readonly IOTileType[]} */
export const VALID_TILE_TYPES = Object.freeze([
    '0', '1', '2', '3', '4', '5', '5!', '←', '↑', '→', '↓'
]);

/**
 * @typedef IOTileType
 * Tile type representation (string)
 * @type { '0' | '1' | '2' | '3' | '4' | '5' | '5!' | '←' | '↑' | '→' | '↓' }
*/

/**
 * @typedef IOTile
 * @property {number} x
 * @property {number} y
 * @property {IOTileType} type - Tile type: '0' (wall), '1' (parcel spawner), '2' (delivery), '3' (walkable), '4' (base), '5' (crate sliding tile), '5!' (crate spawner), or directional arrows '↑', '→', '↓', '←'
 */

/**
 * @param {number | string} typeStr
 * @returns {IOTileType}
 */
export function parseIOTileType(typeStr) {
    const normalized = String(typeStr).trim();
    if (VALID_TILE_TYPES.includes(/** @type {IOTileType} */ (normalized))) {
        return /** @type {IOTileType} */ (normalized);
    }

    console.warn(`Invalid IOTileType: ${normalized}, defaulting to '0'`);
    return '0';
}
