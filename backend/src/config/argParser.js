import { ArgumentParser } from 'argparse';



// Initialize ArgumentParser
const parser = new ArgumentParser({
    description: 'Usage of Deliveroo.js. Use double -- to separate args to be sent to the script, e.g. npm run dev -- -p=80',
    add_help: true
});

parser.add_argument('-p', '--port', {
    dest: 'PORT', type: 'int',
    help: 'Specify a port for the server'
});

parser.add_argument('-k', '--clock', {
    dest: 'CLOCK', type: 'int',
    help: "Specify the clock [ms], 40 (25frame/s), default is 50 (20frame/s)"
});

parser.add_argument('-g', '--game', {
    dest: 'GAME_FILE', type: String,
    help: 'Specify path to a game file. Examples are in @unitn-asa/deliveroo-js-assets package /assets/games/'
});

parser.add_argument('-pp', '--penalty', {
    dest: 'PENALTY', type: 'int',
    help: "Specify penalty in case of invalid action, default is 1"
});

parser.add_argument('-t', '--timeout', {
    dest: 'AGENT_TIMEOUT', type: 'int',
    help: "Specify the timeout for agents, default is 10000"
});

parser.add_argument('--broadcast-logs', {
    dest: 'BROADCAST_LOGS', type: Boolean,
    help: "Broadcast logs to all clients, default is false"
});

/**
 * Parsing Arguments from command line
 * @type {Object}
 * @property {Number} [PORT]
 * @property {Number} [CLOCK]
 * @property {String} [GAME_FILE]
 * @property {Number} [PENALTY]
 * @property {Number} [AGENT_TIMEOUT]
 * @property {Boolean} [BROADCAST_LOGS]
 */
const args = parser.parse_args();

console.log('Command line arguments:', args);

export { args };
