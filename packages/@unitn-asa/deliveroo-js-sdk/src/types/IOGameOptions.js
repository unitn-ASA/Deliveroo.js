
/** @typedef { import("./IOClockEvent.js").IOClockEvent } IOClockEvent */
/** @typedef { import("./IOTile.js").IOTileType } IOTileType */

/**
 * @typedef IOGameOptions
 * 
 * config.js
 * @property {string} title                             Game title
 * @property {string} description                       Game description
 * @property {IOMapOptions} map                         Map configuration
 * @property {IONpcsOptions[]} npcs                     Array of NPC configurations
 * @property {IOParcelsOptions} parcels                 Parcels configuration
 * @property {IOPlayerOptions} player                   Player configuration * 
 */

/**
 * @typedef IOMapOptions
 * @property {number} width                             Map width in tiles
 * @property {number} height                            Map height in tiles
 * @property {string[]} tiles                            Fixed-width rows, stored top-to-bottom
*/

/**
 * @typedef IONpcsOptions
 * NPC configuration object
 * @property {IOClockEvent} moving_event                Event whenever the NPC moves
 * @property {'random'|'intelligent'} type                              NPC type (random, collector, etc.)
 * @property {number} count                             Number of NPCs of this type
*/

/**
 * @typedef IOParcelsOptions
 * Parcels configuration object
 * @property {IOClockEvent} generation_event            Event for parcels generation
 * @property {IOClockEvent} decaying_event              Event for parcel decaying
 * @property {number} max                               Maximum number of parcels in the grid
 * @property {number} reward_avg                        Reward average
 * @property {number} reward_variance                   Reward variance
*/

/**
 * @typedef IOPlayerOptions
 * Player configuration object
 * @property {string} agent_preset                      Default agent component preset ('standard' | 'rotation' | 'ghost' | 'push')
 * @property {number} movement_duration                 Duration of each movement in ms
 * @property {number} observation_distance              Observation distance
 * @property {number} capacity                          Capacity
 */

export { };
