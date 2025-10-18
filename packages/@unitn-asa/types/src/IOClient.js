const IOGenerics = require( './IOGenerics.js' );

/**
 * @typedef {import("./ioTypes.js").IOServerEvents} IOServerEvents
 * @typedef {import("./ioTypes.js").IOClientEvents} IOClientEvents
 * @typedef {import("socket.io-client").Socket< IOServerEvents, IOClientEvents >} ClientSocket
 */

/**
 * @class
 * @extends { IOGenerics<
 *                          IOServerEvents,
 *                          IOClientEvents,
 *                          import("socket.io-client").Socket< IOServerEvents, IOClientEvents >
 * > }
 */
class IOClient extends IOGenerics {

    connect () {
        // console.log( "Connection.connect() connecting to", HOST, "with token:", this.token.slice(0,10)+'...' );
        return this.socket.connect();
    }

}

module.exports = IOClient;