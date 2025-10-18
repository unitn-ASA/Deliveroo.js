const IOGenerics = require( './IOGenerics.js' );

/**
 * @typedef {import("./ioTypes.js").IOClientEvents} IOClientEvents
 * @typedef {import("./ioTypes.js").IOServerEvents} IOServerEvents
 * @typedef {import("socket.io").Socket< IOClientEvents, IOServerEvents >} ServerSocket
 */

/**
 * @class
 * @extends { IOGenerics<
 *                          IOClientEvents,
 *                          IOServerEvents,
 *                          import("socket.io").Socket< IOClientEvents, IOServerEvents >
 * > }
 */
class IOServer extends IOGenerics {

    /**
     * @param {string} room
     */
    to ( room ) {
        return {
            /**
             * @template {keyof IOServerEvents} K
             * @param {K} event
             * @param {Parameters<IOServerEvents[K]>} args
             */
            emit: ( event, ...args ) => {
                this.socket.to( room ).emit( event, ...args );
            },
            fetchSockets: () => this.socket.to( room ).fetchSockets()
        };
    }
    
    get broadcast () {
        return {
            /**
             * @template {keyof IOServerEvents} K
             * @param {K} event
             * @param {Parameters<IOServerEvents[K]>} args
             * @returns {boolean}
             */
            emit: ( event, ...args ) => this.socket.broadcast.emit( event, ...args )
        }
    }

}

module.exports = IOServer;