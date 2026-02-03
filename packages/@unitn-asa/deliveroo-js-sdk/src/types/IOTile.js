
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
    typeStr = String(typeStr);
    const validTypes = ['0', '1', '2', '3', '4', '5', '5!', '←', '↑', '→', '↓'];
    if ( validTypes.includes(typeStr[0]) && typeStr[1] == '!' || typeStr.length === 1 ) {
        return /** @type {IOTileType} */ (typeStr);
    } else {
        console.warn(`Invalid IOTileType: ${typeStr}, defaulting to '0'`);
        return '0';
    }
}
