
module.exports = {

    MAP_FILE: 'map_20',    // options are 'default_map' (DEFAULT), 'empty_map', 'map_20', ...files in levels/maps

    PARCELS_GENERATION_INTERVAL: '10s',  // options are '1s', '2s' (DEFAULT), '5s', '10s'

    MOVEMENT_DURATION: 500,             // default is 500
    AGENTS_OBSERVATION_DISTANCE: 5,     // default is 5
    PARCELS_OBSERVATION_DISTANCE: 40,   // default is 5

    PARCEL_REWARD_AVG: 20,          // default is 30
    PARCEL_REWARD_VARIANCE: 10,     // default is 10
    PARCEL_DECADING_INTERVAL: '1s', // options are '1s', '2s', '5s', '10s', 'infinite' (DEFAULT)

    RANDOMLY_MOVING_AGENTS: 3,  // default is 2
    RANDOM_AGENT_SPEED: '2s'    // options are '1s', '2s' (DEFAULT), '5s', '10s'

}


