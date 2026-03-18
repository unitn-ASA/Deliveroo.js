import { io } from "socket.io-client";
import { DjsClientSocket } from "./DjsClientSocket.js";
/**
 * Get command-line arguments for token and name (Node.js only)
 * Usage: npm run dev -- -token=... -name=... -host=...
 */
function getArgs() {
    if (typeof process !== 'undefined' && process?.argv) {
        // Dynamic import only in Node.js environment
        try {
            const getopts = require('getopts');
            return getopts(process.argv, {
                string: ['token', 'name', 'host'],
            });
        } catch {
            // Fallback if require doesn't work (e.g., in bundler)
            return { token: undefined, name: undefined, host: undefined };
        }
    }
    return { token: undefined, name: undefined, host: undefined };
}

const args = getArgs();



/**
 * @returns { DjsClientSocket }
 */
export function DjsConnect ( host = args['host'] || process.env.HOST, token = args['token'] || process.env.TOKEN, name = args['name'] || process.env.NAME, autoconnect = true ) {

    let opts = {
        autoConnect: false,
        withCredentials: false,
        // extraHeaders: { 'x-token': TOKEN || token }
        // query: { name: NAME }
        // path: '/'
    };
    if ( token && token != '' )
        opts.extraHeaders = { 'x-token': token }
    else if ( name && name != '' )
        opts.query = { name: name }

    const enhancedClientSocket = DjsClientSocket.enhance( io( host, opts ) );
    
    if ( autoconnect )
        enhancedClientSocket.connect();

    console.log( `Connecting to ${host} as ${ token ? 'token '+ (token).substring(0,5)+'...' : name ? 'name '+name : 'guest' }` );

    return enhancedClientSocket;

}



// Example usage:
//
// const socket = connect( 'http://localhost:8080', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjczZDZkOSIsIm5hbWUiOiJub21lX21vbHRvX2x1bmdvXzEiLCJ0ZWFtSWQiOiIyNDc0ZDkiLCJ0ZWFtTmFtZSI6Im5vbWVfdGVhbV9tb2x0b19sdW5nbyIsInJvbGUiOiJ1c2VyIiwiaWF0IjoxNzQ4MzUxOTM3fQ.rhEHyAoaQhqVqhEJ5bqyu3UdcvJWK5RLWKJxkBDAX_0', true );
// socket.emitMove( 'up' );
