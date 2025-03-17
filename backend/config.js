const fs = require('node:fs');
const { ArgumentParser } = require('argparse');



/**
 * Config class
 */
class Config {

    #parameters = {};
    get parameters() { return this.#parameters; }

    /** @type {number} */
    PORT = this.setNumber('PORT', 8080,
        '-p', '--port', 'Specify a port for the server');

    /** @type {string} */
    LEVEL = this.set('LEVEL', 'default_level',
        '-l', '--level', 'Specify path to a level file. Examples are in ./levels folder');

    /** @type {string} path to a map .json file, maps are in levels/maps */
    MAP_FILE = this.set('MAP_FILE', 'default_map',
        '-m', '--map', 'Specify name of map file (without .json) from those in ./levels/maps folder');

    /** @type {import("./src/deliveroo/Clock").ClockEvents} */
    PARCELS_GENERATION_INTERVAL = this.setClockEvent('PARCELS_GENERATION_INTERVAL', '2s',
        '-i', '--parcels-interval', "Specify the interval for parcels generation, options are '1s', '2s', '5s', '10s', default is '2s'");

    /** @type {number} */
    PARCELS_MAX = this.setNumber('PARCELS_MAX', 5,
        '-x', '--parcels-max', "Specify the max number of parcels on the grid, default is 5");

    /** @type {number} */
    PARCEL_REWARD_AVG = this.setNumber('PARCEL_REWARD_AVG', 30,
        '-r', '--reward-avg', "Specify the average reward for parcels, default is 30");

    /** @type {number} */
    PARCEL_REWARD_VARIANCE = this.setNumber('PARCEL_REWARD_VARIANCE', 10,
        '-v', '--reward-variance', "Specify the variance for parcels, default is 10");

    /** @type {import("./src/deliveroo/Clock").ClockEvents} */
    PARCEL_DECADING_INTERVAL = this.setClockEvent('PARCEL_DECADING_INTERVAL', '1s',
        '-c', '--decading-interval', "Specify the decading interval for parcels, options are '1s', '2s', '5s', '10s', 'infinite', default is '1s'");

    /** @type {number} */
    PENALTY = this.setNumber('PENALTY', 1,
        '-pp', '--penalty', "Specify penalty in case of invalid aciton, default is 0");

    /** @type {number} */
    MOVEMENT_STEPS = this.setNumber('MOVEMENT_STEPS', 1,
        '-s', '--mov-steps', "Specify the number of steps for each movement, default is 1");

    /** @type {number} */
    MOVEMENT_DURATION = this.setNumber('MOVEMENT_DURATION', 50,
        '-d', '--mov-duration', "Specify the duration of each movement, default is 50");

    /** @type {number} */
    AGENTS_OBSERVATION_DISTANCE = this.setNumber('AGENTS_OBSERVATION_DISTANCE', 5,
        '-a', '--agent-observation-distance', "Specify the observation distance for agents, default is 5");

    /** @type {number} */
    PARCELS_OBSERVATION_DISTANCE = this.setNumber('PARCELS_OBSERVATION_DISTANCE', 5,
        '-b', '--parcel-observation-distance', "Specify the observation distance for parcels, default is 5");

    /** @type {number} */
    AGENT_TIMEOUT = this.setNumber('AGENT_TIMEOUT', 10000,
        '-t', '--timeout', "Specify the timeout for agents, default is 10000");

    /** @type {number} */
    RANDOMLY_MOVING_AGENTS = this.setNumber('RANDOMLY_MOVING_AGENTS', 2,
        '-z', '--npc-num', "Specify the number of randomly moving agents, default is 2");

    /** @type {import("./src/deliveroo/Clock").ClockEvents} */
    RANDOM_AGENT_SPEED = this.setClockEvent('RANDOM_AGENT_SPEED', '2s',
        '-y', '--npc-speed', "Specify the speed for randomly moving agents, options are '1s', '2s', '5s', '10s', default is '2s'");

    /** @type {number} */
    CLOCK = this.setNumber('CLOCK', 50,
        '-k', '--clock', "Specify the clock [ms], 40 (25frame/s), default is 50 (20frame/s)");

    /** @type {boolean} */
    BROADCAST_LOGS = this.setBool('BROADCAST_LOGS', false,
        undefined, '--broadcast-logs', "Broadcast logs to all clients, default is false");


    
    async lazyLoading ( ) {

        // 1. default values

        // 2. values in process.env

        // 3. Loading from file specified in process.env.LEVEL 
        if (process.env.LEVEL) {
            try {
                const json = loadJavascript( process.env.LEVEL );
                Object.assign( this, json );
                this.LEVEL = process.env.LEVEL;
            } catch (err) {
                console.error( 'Error loading from process.env.LEVEL', process.env.LEVEL );
            }
        }

        // Parsing Arguments
        const parser = new ArgumentParser({
            description: 'Usage of Deliveroo.js. Use double -- to separate args to be sent to the script, e.g. npm run dev -- -p=80',
            add_help: true
        });

        for (const [key, {defaultValue, shortOpt, longOpt, helpText}] of Object.entries(this.#parameters)) {
            if(shortOpt)
                parser.add_argument(shortOpt, longOpt, {dest: key, help: helpText});
            else
                parser.add_argument(longOpt, {dest: key, help: helpText});
        }

        const args = parser.parse_args();

        // 4. Loading from file specified in args.LEVEL
        if ( args.LEVEL ) {
            try {
                const json = loadJavascript( args.LEVEL );
                Object.assign( this, json );
                this.LEVEL = args.LEVEL;
                // console.log( 'Loaded level specified as argument', args.LEVEL );
            } catch (err) {
                console.error( 'Error loading from args.LEVEL', args.LEVEL );
            }
        }
        
        // 5. Overwriting with values specified as args
        Object.keys( args ).forEach( key => {
            if ( args[key] != null && key != 'LEVEL' )
                this[key] = args[key];
        });

        console.log("Initial config:", config);
        
    }


    loadLevel ( ) {
        
        if (this.LEVEL) {
            try {
                const json = loadJavascript( this.LEVEL );
                Object.assign( this, json );
            } catch (err) {
                console.error( 'Error loading from', this.LEVEL );
            }
        }
        
    }




    /**
     * @param {string} key @param {string} defaultValue 
     * @param {string} shortOpt @param {string} longOpt @param {string} helpText 
     * @returns {string}
     */
    set(key, defaultValue, shortOpt, longOpt, helpText) {
        this.#parameters[key] = {defaultValue, shortOpt, longOpt, helpText};
        return process.env[key] || defaultValue;
    }

    /**
     * @param {string} key @param {number} defaultValue 
     * @param {string} shortOpt @param {string} longOpt @param {string} helpText 
     * @returns {number}
     */
    setNumber(key, defaultValue, shortOpt, longOpt, helpText) {
        this.#parameters[key] = {defaultValue, shortOpt, longOpt, helpText};
        return Number( process.env[key] || defaultValue );
    }

    /**
     * @param {string} key @param {boolean} defaultValue 
     * @param {string} shortOpt @param {string} longOpt @param {string} helpText 
     * @returns {boolean}
     */
    setBool(key, defaultValue, shortOpt, longOpt, helpText) {
        this.#parameters[key] = {defaultValue, shortOpt, longOpt, helpText};
        return Boolean( process.env[key] || defaultValue );
    }

    /**
     * @param {string} key
     * @param {import("./src/deliveroo/Clock").ClockEvents} defaultValue
     * @param {string} shortOpt @param {string} longOpt @param {string} helpText
     * @returns {import("./src/deliveroo/Clock").ClockEvents}
     */
    setClockEvent (key, defaultValue, shortOpt, longOpt, helpText) {
        this.#parameters[key] = {defaultValue, shortOpt, longOpt, helpText};
        return process.env[key] || defaultValue;
    }
}



function loadJavascript ( path ) {

    try {
        var js = require( './'+path );
        console.log( 'Javascript loaded from:', './' + path );
        return js;
    } catch ( err ) {
        console.warn( 'Loading javascript from ./' + path, "was not possible, retrying under ./levels/" )
        try {
            var js = require( './levels/' + path );
            console.log( 'Javascript loaded from:', './levels/' + path );
            return js;
        } catch ( err ) {
            console.warn( 'Not even from ./levels/' + path,  "was possible" )
            throw err;
        }
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
            console.error('Error while parsing JSON' + path);
            throw err;
        }
    } catch (err) {
        console.error('Error while reading' + path);
        throw err;
    }
}



const config = new Config();
// console.log("Initial config:", Object.keys(config.parameters).reduce( (obj,key) => { obj[key] = config[key]; return obj; } ,{}) );

module.exports = config;

config.lazyLoading();