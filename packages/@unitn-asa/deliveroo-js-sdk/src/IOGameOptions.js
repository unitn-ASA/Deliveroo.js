
/**
 * @typedef { import("./web-socket/IOClockEvent").IOClockEvent } IOClockEvent
 */

/**
 * @typedef IOGameOptions
 * 
 * config.js
 * @property {string} title                             Game title
 * @property {string} description                       Game description
 * @property {{file: string}} map                       Map configuration
 * @property {number} maxPlayers                        Maximum number of players
 * @property {IONpcsOptions[]} npcs                     Array of NPC configurations
 * @property {IOParcelsOptions} parcels                 Parcels configuration
 * @property {IOPlayerOptions} player                   Player configuration * 
 */

/**
 * @typedef IONpcsOptions
 * NPC configuration object
 * @property {IOClockEvent} moving_event                Event whenever the NPC moves
 * @property {string} type                              NPC type (random, collector, etc.)
 * @property {number} count                             Number of NPCs of this type
 * @property {number} capacity                          Capacity (for collector NPCs)
*/

/**
 * @typedef IOParcelsOptions
 * Parcels configuration object
 * @property {IOClockEvent} generation_event            Event for parcels generation
 * @property {IOClockEvent} decading_event              Event for parcel decading
 * @property {number} max                               Maximum number of parcels in the grid
 * @property {number} reward_avg                        Reward average
 * @property {number} reward_variance                   Reward variance
*/

/**
 * @typedef IOPlayerOptions
 * Player configuration object
 * @property {string} agent_type                        Agent class
 * @property {number} movement_duration                 Duration of each movement in ms
 * @property {number} agents_observation_distance       Observation distance for agents
 * @property {number} parcels_observation_distance      Observation distance for parcels
 * @property {number} capacity                          Capacity
 */

export { };
