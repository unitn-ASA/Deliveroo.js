import { io } from "socket.io-client";
import { DjsClientSocket } from "./DjsClientSocket.js";



/**
 * @returns { DjsClientSocket }
 */
export function DjsConnect ( host = process.env.HOST || 'http://localhost:8080', token = process.env.TOKEN, name = process.env.NAME, autoconnect = true ) {

    let opts = {
        autoConnect: false,
        withCredentials: false,
        extraHeaders: {},       //{ 'x-token': TOKEN || token }
        query: {},              //{ name: NAME }
        // path: '/'
    };
    if ( token && token != '' )
        opts.extraHeaders = { 'x-token': token }
    else if ( name && name != '' )
        opts.query = { name: name }

    const enhancedClientSocket = DjsClientSocket.enhance( io( host, opts ) );

    console.log( `Connecting to ${host} ${ token ? 'with token '+ (token).substring(0,5)+'...'+(token).substring(token.length-5) : name ? 'as '+name : 'with no token and no name' }` );
    
    enhancedClientSocket.onConnect( () => {
        console.log( `Connected` );
    });

    enhancedClientSocket.onceYou( me => {
        console.log( `Authenticated as ${me.name}(${me.id}) in team ${me.teamName}(${me.teamId})` );
    });

    // Handle ping events to measure latency. The server will send a 'ping' event with a timestamp, and the client responds with a 'clientTimestamp' to allow the server to calculate round-trip time and network latency.
    try {
        enhancedClientSocket.on( "ping", ( pingData, callback ) => {
            try {
                callback();
            } catch (error) {
                console.warn("Error handling ping event");
            }
        } );
    } catch (error) {
        console.error("Error setting up ping event:", error);
    }
    
    enhancedClientSocket.on( 'disconnect', (reason) => {
        console.log( `Disconnected from ${host} because ${reason}` );
    });

    enhancedClientSocket.io.on("error", (error) => {
      console.error("Connection error:", error.message);
    });

    enhancedClientSocket.on("connect_error", (error) => {
        console.error("Failed to connect:", error.message);
    });
    
    if ( autoconnect )
        enhancedClientSocket.connect();
    
    return enhancedClientSocket;

}



// Example usage:
//
// const socket = DjsConnect( 'http://localhost:8080', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjczZDZkOSIsIm5hbWUiOiJub21lX21vbHRvX2x1bmdvXzEiLCJ0ZWFtSWQiOiIyNDc0ZDkiLCJ0ZWFtTmFtZSI6Im5vbWVfdGVhbV9tb2x0b19sdW5nbyIsInJvbGUiOiJ1c2VyIiwiaWF0IjoxNzQ4MzUxOTM3fQ.rhEHyAoaQhqVqhEJ5bqyu3UdcvJWK5RLWKJxkBDAX_0', true );
// socket.emitMove( 'up' );
