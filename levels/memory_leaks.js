/**
 * This file contains the configuration for the memory leaks test.
 * @type {import('../config')}
 */
module.exports = {

    MAP_FILE: '24c1_1',    // options are 'default_map' (DEFAULT), 'empty_map', 'map_20', ...files in levels/maps

    MOVEMENT_STEPS: 1,                  // default is 1
    MOVEMENT_DURATION: 100,             // default is 500
    AGENTS_OBSERVATION_DISTANCE: 8,     // default is 5
    PARCELS_OBSERVATION_DISTANCE: 5,    // default is 5

    PARCELS_GENERATION_INTERVAL: '10s', // options are '1s', '2s' (DEFAULT), '5s', '10s'
    PARCELS_MAX: 0,                   // 'infinite' (DEFAULT)
    PARCEL_REWARD_AVG: 4000,              // default is 30
    PARCEL_REWARD_VARIANCE: 50,         // default is 10
    // PARCEL_DECADING_INTERVAL: 'frame',     // options are '1s', '2s', '5s', '10s', 'infinite' (DEFAULT)

    RANDOMLY_MOVING_AGENTS: 400,         // default is 2
    RANDOM_AGENT_SPEED: 'frame',        // options are '1s', '2s' (DEFAULT), '5s', '10s'

    CLOCK: 1,  // default is 50 (50ms are 20frame/s)

}


