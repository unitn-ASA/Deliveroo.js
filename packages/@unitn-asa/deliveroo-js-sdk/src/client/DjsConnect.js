import { io } from "socket.io-client";
import { default as argsparser } from "args-parser";
import { DjsClientSocket } from "./DjsClientSocket.js";



/**
 * Takes the following arguments from console:
 * token or name
 * e.g:
 * $ node index.js -token=... -name=marco
 * $ npm start -- -token=... -name=marco
 */
const args = argsparser(process? process?.argv : []);



/**
 * @returns { DjsClientSocket }
 */
export function DjsConnect ( host, token = args['token'], name = args['name'], autoconnect = true ) {

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
