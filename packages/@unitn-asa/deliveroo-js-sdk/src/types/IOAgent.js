
/** @typedef {import('./IOAttribute.js').IOAttribute} IOAttribute */

/**
 * @typedef IOAgent
 * @property {string} id
 * @property {string} name
 * @property {string} teamId
 * @property {string} teamName
 * @property {number=} x
 * @property {number=} y
 * @property {number} score
 * @property {number=} rotation - Facing: 0=North, 1=East, 2=South, 3=West. Always defined (defaults to 0); the standard movement autorotates it to the movement direction, rotation-based components turn it explicitly
 * @property {IOAttribute[]=} attributes - Observable attributes, plugin-owned (e.g. movement_mode, energy) plus the 'warnings' count of invalid client actions
 */

export { };
