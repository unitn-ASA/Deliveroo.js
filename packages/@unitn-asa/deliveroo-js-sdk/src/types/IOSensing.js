
/** @typedef {import('./IOAgent.js').IOAgent} IOAgent */
/** @typedef {import('./IOParcel.js').IOParcel} IOParcel */
/** @typedef {import('./IOCrate.js').IOCrate} IOCrate */
/** @typedef {import('./IOEntity.js').IOEntity} IOEntity */

/**
 * @typedef IOSensing
 * @property {number} [frame] Server frame when the sensing snapshot was produced
 * @property {{x:number, y:number}[]} positions
 * @property {IOAgent[]} agents
 * @property {IOParcel[]} parcels
 * @property {IOCrate[]} crates
 * @property {IOAgent} [self] The sensing agent itself, with plugin-owned attributes
 * @property {IOEntity[]} [entities] Perceived plugin-owned spatial entities
 */

export { };
