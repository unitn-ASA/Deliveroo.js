/**
 * @typedef {import('./TileType')} TileType
 * @typedef {import('./AgentType')} AgentType
 * @typedef {import('./ParcelType')} ParcelType
 */

/**
 * @typedef GridType
 * @type {{
 *   width: number,
 *   height: number,
 *   getTile: function(number, number): TileType,
 *   agents: Map<string, AgentType>,
 *   parcels: Map<string, ParcelType>
 * }}
 */

module.exports = {
  GridType: /** @type {GridType} */ ({})
};