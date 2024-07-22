const config = {

    MAP_FILE: 'default_map',    // options are 'default_map' (DEFAULT), 'empty_map', 'map_20', ...files in levels/maps

    ENTITIES: ['Parcel','Obstacle'],
    AGENTS: ['God'],
    AGENTSCONTROLLER: {
        Agent: 'Controller',
        God: 'ControllerGod'
    },
    TILETYPEMAP:{
        0: 'Hole',  
        1: 'Spawner',  
        2: 'Delivery',
        3: 'Fast'  
    },

    PARCEL_GENERATION_INTERVAL: '2s',  // options are '1s', '2s' (DEFAULT), '5s', '10s'
    PARCEL_MAX: '5',                  // 'infinite' (DEFAULT)

    OBSTACLE_MAX: '5',                  // 'infinite' (DEFAULT)

    MOVEMENT_STEPS: 1,                  // default is 1
    MOVEMENT_DURATION: 50,              // default is 500
    AGENTS_OBSERVATION_DISTANCE: 5,     // default is 5, supports 'infinite'
    ENTITIES_OBSERVATION_DISTANCE: 5,    // default is 5, supports 'infinite' 
    AGENT_TIMEOUT: 10000,               // default is 10000

    PARCEL_REWARD_AVG: 30,          // default is 30
    PARCEL_REWARD_VARIANCE: 10,     // default is 10
    PARCEL_DECADING_INTERVAL: '1s', // options are '1s', '2s', '5s', '10s', 'infinite' (DEFAULT)

    RANDOMLY_MOVING_AGENTS: 2,  // default is 2
    RANDOM_AGENT_SPEED: '2s',   // options are '1s', '2s' (DEFAULT), '5s', '10s'

    CLOCK: 50,  // default is 50 (50ms are 20frame/s)

    BROADCAST_LOGS: false  // default is false

}



const LEVEL = process.argv[2] || process.env.LEVEL;

try {
    if ( LEVEL ) {
        Object.assign( config, require( './levels/' + LEVEL ) );
        console.log( 'Level loaded:', LEVEL, config );
    } else
        console.log( 'Level not specified, using default config', config )
} catch ( error ) {
    console.error( 'Error while loading level', LEVEL, config )
}

module.exports = config


