
/** @typedef { import("./IOClockEvent.js").IOClockEvent } IOClockEvent */
/** @typedef { import("./IOClockEvent.js").IOClockEventSetting } IOClockEventSetting */
/** @typedef { import("./IOTile.js").IOTileType } IOTileType */

/**
 * @typedef IOGameOptions
 * 
 * config.js
 * @property {string} title                             Game title
 * @property {string} description                       Game description
 * @property {IOMapOptions} map                         Map configuration
 * @property {IONpcsOptions[]} npcs                     Array of NPC configurations
 * @property {string[]} [plugins]                       Optional: ids of plugins to load and start (discovered from src/plugins/ manifests)
 * @property {IOEnergyPluginOptions} [energy]            Optional: energy plugin configuration
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
 * @property {IOClockEventSetting} moving_event        Event whenever the NPC moves ('infinite' = never)
 * @property {'random'|'intelligent'} type                              NPC type (random, collector, etc.)
 * @property {number} count                             Number of NPCs of this type
*/

/**
 * @typedef IOParcelsOptions
 * Parcels configuration object
 * @property {IOClockEventSetting} generation_event     Event for parcels generation ('infinite' = never)
 * @property {IOClockEventSetting} decaying_event       Event for parcel decaying ('infinite' = never)
 * @property {number} max                               Maximum number of parcels in the grid
 * @property {number} reward_avg                        Reward average
 * @property {number} reward_variance                   Reward variance
*/

/**
 * @typedef IOPlayerOptions
 * Player configuration object
 * @property {Record<string, number|string>} attributes       Initial agent attributes seeded at creation (e.g. movement_mode: 'ghost', rank: 3)
 * @property {number} movement_duration                 Duration of each movement in ms
 * @property {number} observation_distance              Observation distance
 * @property {number} capacity                          Capacity
 */

/**
 * @typedef IOEnergyPluginOptions
 * Energy plugin configuration
 * @property {number} initial                           Initial (and maximum) energy
 * @property {number} move_cost                         Energy cost of one successful move
 * @property {number} pickup_cost                       Energy cost of one successful pickup
 * @property {number} putdown_cost                       Energy cost of one successful putdown
 * @property {IOClockEventSetting} recharge_event              Clock event triggering passive recharge ('infinite' = never)
 * @property {number} recharge_amount                   Energy restored at each passive recharge
 * @property {IOClockEventSetting} batteries_generation_event   Clock event: empty battery-spawner tiles get a battery ('infinite' = never)
 */

export { };
