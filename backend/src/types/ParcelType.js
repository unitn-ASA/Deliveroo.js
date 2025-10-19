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

/**
 * @typedef SensedParcel
 * @type {ParcelType}
 */

export const ParcelType = /** @type {ParcelType} */ ({});