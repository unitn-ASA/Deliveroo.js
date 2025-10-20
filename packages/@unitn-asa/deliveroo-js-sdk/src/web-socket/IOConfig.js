
/**
 * @typedef { 'frame' | '1s' | '2s' | '5s' | '10s' } ClockEvent
 */


/**
 * @typedef IOConfig
 * 
 * config.js
 * @property {string} level                         Current level identifier
 * @property {string} map                           Current map identifier
 * @property {string[]} plugins                     Default plugins
 * @property {string} agent_type                    Default agent class
 * 
 * ParcelSpawner.js
 * @property {ClockEvent} parcels_generation_interval Event for parcels generation
 * @property {number} parcels_max                   Maximum number of parcels in the grid
 * @property {number} parcel_reward_avg             Average reward for each parcel when spawned
 * @property {number} parcel_reward_variance        Variance of the reward for each parcel when spawned
 * 
 * NPCspawner.js
 * @property {number} randomly_moving_agents        Number of NPCs
 * @property {string} random_agent_speed            Event for moving NPCs
 * 
 * Parcel.js
 * @property {ClockEvent} parcel_decading_interval  Event for parcel decading
 * Agent.js
 * @property {number} penalty                       Penalty for each invalid action
 * @property {number} movement_steps                Number of steps for each movement
 * @property {number} movement_duration             Duration of each movement in ms
 * Sensor.js
 * @property {number} agents_observation_distance   Observation distance for agents
 * @property {number} parcels_observation_distance  Observation distance for parcels
 * 
 * ioServer.js
 * @property {number} agent_timeout                 Timeout for agents in ms
 * @property {boolean} broadcast_logs               Broadcast logs to all clients
 * 
 * Clock.js
 * @property {number} clock                         Clock in ms
 * 
 */

module.exports = { };
