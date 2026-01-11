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

parser.add_argument('-l', '--level', {
    dest: 'LEVEL', type: String,
    help: 'Specify path to a level file. Examples are in ./levels folder'
});

parser.add_argument('-m', '--map', {
    dest: 'MAP', type: String,
    help: 'Specify name of a map'
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
 * @property {String} [LEVEL]
 * @property {String} [MAP]
 * @property {Number} [PENALTY]
 * @property {Number} [AGENT_TIMEOUT]
 * @property {Boolean} [BROADCAST_LOGS]
 */
const args = parser.parse_args();

console.log('Command line arguments:', args);

export { args };
