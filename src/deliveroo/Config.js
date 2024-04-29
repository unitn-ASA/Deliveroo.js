const fs = require('node:fs');
const { ArgumentParser } = require('argparse');



const parser = new ArgumentParser({
    description: 'Usage of Deliveroo.js. Use double -- to separate args to be sent to the script, e.g. npm run dev -- -p=80',
    add_help: true
});

parser.add_argument('-p', '--port', { dest:'PORT', help: 'Specify a port for the server' });

parser.add_argument('-l', '--level', { dest:'LEVEL', help: 'Specify path to a level.json file. Examples are in ./levels folder' });
parser.add_argument('-m', '--map', { dest:'MAP_FILE', help: 'Specify name of map file (without .json) from those in ./levels/maps folder' });

parser.add_argument('-i', '--parcels-interval', { dest:'PARCELS_GENERATION_INTERVAL', help: "Specify the interval for parcels generation, options are '1s', '2s', '5s', '10s', default is '2s'" });
parser.add_argument('-x', '--parcels-max', { dest:'PARCELS_MAX', help: "Specify the max number of parcels on the grid, default is 5" });
parser.add_argument('-r', '--reward-avg', { dest:'PARCEL_REWARD_AVG', help: "Specify the average reward for parcels, default is 30" });
parser.add_argument('-v', '--reward-variance', { dest:'PARCEL_REWARD_VARIANCE', help: "Specify the variance for parcels, default is 10" });
parser.add_argument('-c', '--decading-interval', { dest:'PARCEL_DECADING_INTERVAL', help: "Specify the decading interval for parcels, options are '1s', '2s', '5s', '10s', 'infinite', default is '1s'" });

parser.add_argument('-s', '--mov-steps', { dest:'MOVEMENT_STEPS', help: "Specify the number of steps for each movement, default is 1" });
parser.add_argument('-d', '--mov-duration', { dest:'MOVEMENT_DURATION', help: "Specify the duration of each movement, default is 50" });
parser.add_argument('-a', '--agent-observation-distance', { dest:'AGENTS_OBSERVATION_DISTANCE', help: "Specify the observation distance for agents, default is 5" });
parser.add_argument('-b', '--parcel-observation-distance', { dest:'PARCELS_OBSERVATION_DISTANCE', help: "Specify the observation distance for parcels, default is 5" });
parser.add_argument('-t', '--timeout', { dest:'AGENT_TIMEOUT', help: "Specify the timeout for agents, default is 10000" });

parser.add_argument('-z', '--npc-num', { dest:'RANDOMLY_MOVING_AGENTS', help: "Specify the number of randomly moving agents, default is 2" });
parser.add_argument('-y', '--npc-speed', { dest:'RANDOM_AGENT_SPEED', help: "Specify the speed for randomly moving agents, options are '1s', '2s', '5s', '10s', default is '2s'" });

parser.add_argument('-k', '--clock', { dest:'CLOCK', help: "Specify the clock, default is 50" });

const args = parser.parse_args();



/**
 * Config class
 * @property {string} LEVEL
 * @property {string} MAP_FILE - path to a map .json file, maps are in levels/maps
 * @property {string} PARCELS_GENERATION_INTERVAL - options are '1s', '2s', '5s', '10s', default is '2s'
 * @property {number || 'infinite'} PARCELS_MAX - Max number of parcels on the grid, default is 5
 * @property {number} PARCEL_REWARD_AVG - default is 30
 * @property {number} PARCEL_REWARD_VARIANCE - default is 10
 * @property {string} PARCEL_DECADING_INTERVAL - options are '1s', '2s', '5s', '10s', 'infinite', default is '1s'
 * @property {number} MOVEMENT_STEPS - default is 1
 * @property {number} MOVEMENT_DURATION - default is 50
 * @property {number || 'infinite'} AGENTS_OBSERVATION_DISTANCE - default is 5
 * @property {number || 'infinite'} PARCELS_OBSERVATION_DISTANCE - default is 5
 * @property {number} AGENT_TIMEOUT - default is 10000
 * @property {number} RANDOMLY_MOVING_AGENTS - default is 2
 * @property {string} RANDOM_AGENT_SPEED - options are '1s', '2s', '5s', '10s', default is '2s'
 * @property {number} CLOCK - default is 50

 */
class Config {
    
    /** @type {string} LEVEL */
    LEVEL = 'none';
    /** @type {string} path to a map .json file, maps are in levels/maps */
    MAP_FILE = process.env.MAP_FILE || 'default_map';
    
    /** @type {string} options are '1s', '2s', '5s', '10s', default is '2s' */
    PARCELS_GENERATION_INTERVAL = process.env.PARCELS_GENERATION_INTERVAL || '2s';
    /** @type {number || 'infinite'} Max number of parcels on the grid, default is 5 */
    PARCELS_MAX = process.env.PARCELS_MAX || '5';
    /** @type {number} default is 30 */
    PARCEL_REWARD_AVG = process.env.PARCEL_REWARD_AVG || 30;
    /** @type {number} default is 10 */
    PARCEL_REWARD_VARIANCE = process.env.PARCEL_REWARD_VARIANCE || 10;
    /** @type {string} options are '1s', '2s', '5s', '10s', 'infinite', default is '1s' */
    PARCEL_DECADING_INTERVAL = process.env.PARCEL_DECADING_INTERVAL || '1s';
    
    /** @type {number} default is 1 */
    MOVEMENT_STEPS = process.env.MOVEMENT_STEPS || 1;
    /** @type {number} default is 50 */
    MOVEMENT_DURATION = process.env.MOVEMENT_DURATION || 50;
    /** @type {number || 'infinite'} default is 5 */
    AGENTS_OBSERVATION_DISTANCE = process.env.AGENTS_OBSERVATION_DISTANCE || 5;
    /** @type {number || 'infinite'} default is 5 */
    PARCELS_OBSERVATION_DISTANCE = process.env.PARCELS_OBSERVATION_DISTANCE || 5; 
    /** @type {number} default is 10000 */
    AGENT_TIMEOUT = process.env.AGENT_TIMEOUT || 10000;
    
    /** @type {number} default is 2 */
    RANDOMLY_MOVING_AGENTS = process.env.RANDOMLY_MOVING_AGENTS || 2;
    /** @type {string} options are '1s', '2s', '5s', '10s', default is '2s' */
    RANDOM_AGENT_SPEED = process.env.RANDOM_AGENT_SPEED || '2s';

    /** @type {number} default is 50 (=20frame/s) */
    CLOCK = process.env.CLOCK || 50;

    
    /** @param {Config} config */
    constructor ( config = {} ) {

        // 1. default values
        
        // 2. values in process.env

        // 3. values secified as args
        Object.keys( args ).forEach( key => {
            if ( args[key] != null && key != 'LEVEL' )
                this[key] = args[key];
        });

        // 4. Loading from file specified in process.env.LEVEL 
        if (process.env.LEVEL) {
            try {
                const json = loadFromJson( process.env.LEVEL );
                Object.assign( this, json );
                this.LEVEL = process.env.LEVEL;
            } catch (err) {
                console.error( 'Error loading from process.env.LEVEL', process.env.LEVEL );
            }
        }

        // 5. Loading from file specified in args.LEVEL
        if ( args.LEVEL ) {
            try {
                const json = loadFromJson( args.LEVEL );
                Object.assign( this, json );
                this.LEVEL = args.LEVEL;
                // console.log( 'Loaded level specified as argument', args.LEVEL );
            } catch (err) {
                console.error( 'Error loading from args.LEVEL', args.LEVEL );
            }
        }
        
        // 6. Overwriting with values specified as args
        Object.keys( args ).forEach( key => {
            if ( args[key] != null && key != 'LEVEL' )
                this[key] = args[key];
        });

        // 7. Overwriting with values specified from config.LEVEL
        if ( config.LEVEL ) {
            try {
                const json = loadFromJson( config.LEVEL );
                Object.assign( this, json );
                this.LEVEL = config.LEVEL;
                // console.log( 'Loaded custom level', config.LEVEL );
            } catch (err) {
                console.error( 'Error loading from custom', config.LEVEL );
            }    
        }
                
        // 8. Overwriting with values specified as config
        Object.keys( config ).forEach( key => {
            
            if ( config[key] != null && key != 'LEVEL' ){

                this[key] = config[key];
                
                // menage the case of AGENTS_OBSERVATION_DISTANCE and PARCELS_OBSERVATION_DISTANCE
                if( key == 'AGENTS_OBSERVATION_DISTANCE' || key == 'PARCELS_OBSERVATION_DISTANCE'){
                    //console.log(key, ': ', config[key])
                    /* if the given value is not a number the Config atribute is set default to infinite; 
                    this is usefull if the user send some strang value for the creation of a new match */
                    if (isNaN(parseFloat(config[key]))){this[key] = 'infinite'}
                }

            }
            
        });

        
        
    }



}


function loadFromJson ( path ) {
    if ( !path ) {
        throw new Error('No path specified');
    }
    try {
        const contents = fs.readFileSync(path, 'utf8');
        try {
            return JSON.parse(contents);
        } catch (err) {
            throw new Error('Error while parsing JSON' + path, err);
        }
    } catch (err) {
        throw new Error('Error while reading' + path, err);
    }
}


// var defaultConfig = new Config();
// console.log( 'Default config is:', defaultConfig );

module.exports = Config