/**
 * @typedef {import('./AgentType').AgentType} AgentType
 */

/**
 * @typedef ParcelType
 * @type {{
 *   id: string,
 *   x: number,
 *   y: number,
 *   reward: number,
 *   carriedBy?: AgentType | null
 * }}
 */

const AgentType = require("./AgentType");

/**
 * @typedef SensedParcel
 * @type {ParcelType}
 */

module.exports = {
    ParcelType: /** @type {ParcelType} */ ({})
};