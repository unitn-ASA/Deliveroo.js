/**
 * @typedef {import('./GridType')} GridType
 * @typedef {import('./IdentityType')} IdentityType
 */

/**
 * @typedef AgentType
 * @type {{
 *   id: string,
 *   name: string,
 *   teamId: string,
 *   teamName: string,
 *   x: number,
 *   y: number,
 *   score: number,
 *   penalty: number
 * }}
 */

/**
 * @typedef SensedAgent
 * @type {AgentType}
 */

/**
 * @typedef AgentConstructorOptions
 * @type {{
 *   grid: GridType,
 *   identity: IdentityType
 * }}
 */

module.exports = {
  AgentType: /** @type {AgentType} */ ({})
};