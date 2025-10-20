import fs from 'node:fs';
import { ArgumentParser } from 'argparse';
import { parseClockEvent } from './src/deliveroo/Types.js';
import path from 'path';
import { fileURLToPath } from 'url';

// ESM-friendly __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * @typedef {import("./src/deliveroo/Types.js").ClockEvent} ClockEvent
 */



/**
 * Config class
 */
class Config {
    
    async lazyLoading ( ) {

        // Initialize ArgumentParser
        const parser = new ArgumentParser({
            description: 'Usage of Deliveroo.js. Use double -- to separate args to be sent to the script, e.g. npm run dev -- -p=80',
            add_help: true
        });

        /** @type {Number} */
        this.PORT = Number(process.env.PORT) || 8080;
        parser.add_argument('-p', '--port', {
            dest: 'PORT', type: 'int',
            help: 'Specify a port for the server'
        });

        /** @type {String} */
        this.LEVEL = process.env.LEVEL || undefined;
        parser.add_argument('-l', '--level', {
            dest: 'LEVEL', type: String,
            help: 'Specify path to a level file. Examples are in ./levels folder'
        });

        /** @type {String} */
        this.MAP_FILE = process.env.MAP_FILE || 'default_map';
        parser.add_argument('-m', '--map', {
            dest: 'MAP_FILE', type: String,
            help: 'Specify name of map file (without .json) from those in ./levels/maps folder'
        });

        /** @type {ClockEvent} */
        this.PARCELS_GENERATION_INTERVAL = parseClockEvent( process.env.PARCELS_GENERATION_INTERVAL || '2s' );
        parser.add_argument('-i', '--parcels-interval', {
            dest: 'PARCELS_GENERATION_INTERVAL', type: parseClockEvent,
            help: "Specify the interval for parcels generation, options are '1s', '2s', '5s', '10s', default is '2s'"
        });

        /** @type {Number} */
        this.PARCELS_MAX = Number(process.env.PARCELS_MAX) || 5;
        parser.add_argument('-x', '--parcels-max', {
            dest: 'PARCELS_MAX', type: 'int',
            help: "Specify the max Number of parcels on the grid, default is 5"
        });

        /** @type {Number} */
        this.PARCEL_REWARD_AVG = Number(process.env.PARCEL_REWARD_AVG) || 30;
        parser.add_argument('-r', '--reward-avg', {
            dest: 'PARCEL_REWARD_AVG', type: 'int',
            help: "Specify the average reward for parcels, default is 30"
        });

        /** @type {Number} */
        this.PARCEL_REWARD_VARIANCE = Number(process.env.PARCEL_REWARD_VARIANCE) || 10;
        parser.add_argument('-v', '--reward-variance', {
            dest: 'PARCEL_REWARD_VARIANCE', type: 'int',
            help: "Specify the variance for parcels, default is 10"
        });

        /** @type {ClockEvent} */
        this.PARCEL_DECADING_INTERVAL = parseClockEvent( process.env.PARCEL_DECADING_INTERVAL || '1s' );
        parser.add_argument('-c', '--decading-interval', {
            dest: 'PARCEL_DECADING_INTERVAL', type: parseClockEvent,
            help: "Specify the decading interval for parcels, options are '1s', '2s', '5s', '10s', 'infinite', default is '1s'"
        });

        /** @type {Number} PENALTY */
        this.PENALTY = Number(process.env.PENALTY) || 1;
        parser.add_argument('-pp', '--penalty', {
            dest: 'PENALTY', type: 'int',
            help: "Specify penalty in case of invalid action, default is 0"
        });

        /** @type {Number} */
        this.MOVEMENT_STEPS = Number(process.env.MOVEMENT_STEPS) || 1;
        parser.add_argument('-s', '--mov-steps', {
            dest: 'MOVEMENT_STEPS', type: 'int',
            help: "Specify the Number of steps for each movement, default is 1"
        });

        /** @type {Number} */
        this.MOVEMENT_DURATION = Number(process.env.MOVEMENT_DURATION) || 50;
        parser.add_argument('-d', '--mov-duration', {
            dest: 'MOVEMENT_DURATION', type: 'int',
            help: "Specify the duration of each movement, default is 50"
        });

        /** @type {Number} */
        this.AGENTS_OBSERVATION_DISTANCE = Number(process.env.AGENTS_OBSERVATION_DISTANCE) || 5;
        parser.add_argument('-a', '--agent-observation-distance', {
            dest: 'AGENTS_OBSERVATION_DISTANCE', type: 'int',
            help: "Specify the observation distance for agents, default is 5"
        });

        /** @type {Number} */
        this.PARCELS_OBSERVATION_DISTANCE = Number(process.env.PARCELS_OBSERVATION_DISTANCE) || 5;
        parser.add_argument('-b', '--parcel-observation-distance', {
            dest: 'PARCELS_OBSERVATION_DISTANCE', type: 'int',
            help: "Specify the observation distance for parcels, default is 5"
        });

        /** @type {Number} */
        this.AGENT_TIMEOUT = Number(process.env.AGENT_TIMEOUT) || 10000;
        parser.add_argument('-t', '--timeout', {
            dest: 'AGENT_TIMEOUT', type: 'int',
            help: "Specify the timeout for agents, default is 10000"
        });

        /** @type {Number} */
        this.RANDOMLY_MOVING_AGENTS = Number(process.env.RANDOMLY_MOVING_AGENTS) || 0;
        parser.add_argument('-z', '--npc-num', {
            dest: 'RANDOMLY_MOVING_AGENTS', type: 'int',
            help: "Specify the Number of randomly moving agents, default is 0"
        });

        /** @type {ClockEvent} */
        this.RANDOM_AGENT_SPEED = parseClockEvent( process.env.RANDOM_AGENT_SPEED || '2s' );
        parser.add_argument('-y', '--npc-speed', {
            dest: 'RANDOM_AGENT_SPEED', type: parseClockEvent,
            help: "Specify the speed for randomly moving agents, options are '1s', '2s', '5s', '10s', default is '2s'"
        });

        /** @type {Number} */
        this.CLOCK = Number(process.env.CLOCK) || 50;
        parser.add_argument('-k', '--clock', {
            dest: 'CLOCK', type: 'int',
            help: "Specify the clock [ms], 40 (25frame/s), default is 50 (20frame/s)"
        });

        /** @type {boolean} */
        this.BROADCAST_LOGS = Boolean(process.env.BROADCAST_LOGS) || false;
        parser.add_argument('--broadcast-logs', {
            dest: 'BROADCAST_LOGS', type: Boolean,
            help: "Broadcast logs to all clients, default is false"
        });

        /** @type {String[]} */
        this.PLUGINS = process.env.PLUGINS?.split(' ') || [];
        parser.add_argument('-u', '--plugins', {
            dest: 'PLUGINS', type: String, nargs: '*',
            help: "Specify the plugins to load, no plugin is loaded by default"
        });

        /** @type {String} */
        this.AGENT_TYPE = process.env.AGENT_TYPE || 'DefaultAgent';
        parser.add_argument('-g', '--agent-type', {
            dest: 'AGENT_TYPE', type: String,
            help: "Specify the agent class to use"
        });

        // Parsing Arguments from command line
    const args = parser.parse_args();

        // 1. default values

        // 2. values in process.env

        // 3. Loading from file specified in process.env.LEVEL 
        if (process.env.LEVEL) {
            try {
                const json = await this.loadJavascript(process.env.LEVEL);
                Object.assign(this, json);
                this.LEVEL = process.env.LEVEL;
            } catch (err) {
                console.error('Error loading from process.env.LEVEL', process.env.LEVEL);
            }
        }

        // 4. Loading from file specified in args.LEVEL
        if (args.LEVEL) {
            try {
                const json = await this.loadJavascript(args.LEVEL);
                Object.assign(this, json);
                this.LEVEL = args.LEVEL;
            } catch (err) {
                console.error('Error loading from args.LEVEL', args.LEVEL);
            }
        }
        
        // 5. Overwriting with values specified as args
        Object.keys( args ).forEach( key => {
            if ( args[key] != null && key != 'LEVEL' )
                this[key] = args[key];
        });

        // 6. Loading plugins here causes circular dependency and Agent not a constructor error
        // this.loadPlugins();

        console.log("Initial config:", config);
        
    }



    async loadJavascript(pathRel) {
        try {
            const filePath = path.isAbsolute(pathRel) ? pathRel : path.join(__dirname, pathRel);
            const mod = await import('file://' + filePath);
            const js = mod.default ?? mod;
            console.log('Config.loadJavascript succesfully loaded', './' + pathRel);
            return js;
        } catch (err) {
            console.warn('WARN Config.loadJavascript file not found in ./' + pathRel, err);
            throw err;
        }
    }
    
    loadConfigsFromJson ( ) {
        
        if (this.LEVEL) {
            try {
                const json = this.loadFromJson( this.LEVEL );
                Object.assign( this, json );
            } catch (err) {
                console.error( 'Error loading from', this.LEVEL );
            }
        }
        
    }
    
    loadFromJson ( path ) {
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

    async loadPlugins() {
        if (this.PLUGINS) {
            if (typeof this.PLUGINS === 'string') this.PLUGINS = String(this.PLUGINS).split(' ');
            for (const p of this.PLUGINS) {
                try {
                    // resolve plugins relative to the backend folder (__dirname)
                    var filePath = path.isAbsolute(p) ? p : path.join(__dirname, p);
                    // add .js if missed
                    if (path.extname(filePath) !== '.js') {
                        filePath += '.js';
                    }
                    // import the plugin
                    const mod = await import('file://' + filePath);
                    const js = mod.default ?? mod;
                    console.log('Plugin loaded', p, js);
                } catch (err) {
                    console.error('ERROR loading plugin', p);
                    console.error(err);
                }
            }
        }
    }

}



const config = new Config();
export default config;

// initialize
await config.lazyLoading();