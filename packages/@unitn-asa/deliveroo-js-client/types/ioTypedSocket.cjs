
/**
 * @typedef agent
 * @property {string} id
 * @property {string} name
 * @property {string} teamId
 * @property {string} teamName
 * @property {number} x
 * @property {number} y
 * @property {number} score
 * @property {number} penalty
 */

/**
 * @typedef parcel
 * @property {string} id
 * @property {number} x
 * @property {number} y
 * @property {string=} carriedBy
 * @property {number} reward
 */

/**
 * @typedef tile
 * @property {number} x
 * @property {number} y
 * @property {string} type
 */

/**
 * @typedef timestamp
 * @property {number} ms
 * @property {number} frame
 */

/**
 * @typedef {{
 *      'disconnect':   function () : void,
 *      'move':         function ( 'up' | 'right' | 'left' | 'down' | { x:number, y:number }, function ( { x:number, y:number } | false ) : void = ) : { x:number, y:number } | false,
 *      'pickup':       function ( function ( { id:string } [] ) : void = ) : { id:string } [],
 *      'putdown':      function ( string [] =, function ( { id:string } [] ) : void = ) : { id:string } [],
 *      'say':          function ( string, any, function( 'successful' ) : void ) : void,
 *      'ask':          function ( string, any, function( any ) : void ) : void,
 *      'shout':        function ( any, function( any ) : void ) : void,
 *      'parcel':       function ( 'create' | 'dispose' | 'set', { x:number, y:number } | { id:string, reward?:number } ) : void,
 *      'restart':      function () : void,
 *      'tile':         function ( tile ) : void,
 *      'log':          function ( ...any ) : void
 * }} clientEvents
 */

/**
 * @typedef {{
 *      'connect':          function () : void,
 *      'disconnect':       function () : void,
 *      'config':           function ( any ) : void,
 *      'map':              function ( number, number, tile[] ) : void,
 *      'tile':             function ( tile, timestamp ) : void,
 *      'controller':       function ( 'connected' | 'disconnected', {id:string, name:string, teamId:string, teamName:string, score:number} ) : void,
 *      'you':              function ( agent, timestamp ) : void,
 *      'agents sensing':   function ( agent[], timestamp ) : void,
 *      'parcels sensing':  function ( parcel[], timestamp ) : void,
 *      'msg':              function ( string, string, Object, function ( Object ) : void = ) : Object,
 *      'log':              function ( {src: 'server'|'client', ms:number, frame:number, socket:string, id:string, name:string}, ...any ) : void
 * }} serverEvents
 */



/**
 * @class
 * @template { Record< string, function(...any):void > } onEv events to be listened with .on
 * @template { Record< string, function(...any):void > } emitEv events to be emitted with .emit
 */
class ioTypedSocket {

    /** @type { import("socket.io").Socket } */
    #socket;

    // get disconnect () { return this.#socket.disconnect }

    /**
     * @type {string}
     */
    get id () { return this.#socket.id }

    disconnect () {
        this.#socket.disconnect();
    }

    /**
     * @template {keyof onEv} K
     * @param {K} event
     * @param {onEv[K]} listener
     * @returns {void}
     */
    on ( event, listener ) {
        this.#socket.on( event.toString(), listener );
    }

    /**
     * @template {keyof onEv} K
     * @param {K} event
     * @param {onEv[K]} listener
     * @returns {void}
     */
    once ( event, listener ) {
        this.#socket.once( event.toString(), listener );
    }
    
    /**
     * @template { keyof emitEv } K
     * @param { K } event
     * @param { Parameters<emitEv[K]> } args
     * @returns { void }
     */
    emit ( event, ...args ) {
        this.#socket.emit( event.toString(), ...args );
    }
    
    /**
     * @template { keyof emitEv } K
     * @param { K } event
     * @param { Parameters<emitEv[K]> } args
     * @returns { Promise < any > }
     */
    async emitAndResolveOnAck ( event, ...args ) {
        // console.log( 'emitAndResolveOnAck', event.toString(), ...args );
        return new Promise( (resolve) => {
            setTimeout( () => resolve( false ), 1000 );
            this.#socket.emit( event.toString(), ...args, reply =>
                resolve( reply )
            );
        } );
    }
    
    /**
     * @param {string} room
     */
    to ( room ) {
        return {
            /**
             * @template {keyof emitEv} K
             * @param {K} event
             * @param {Parameters<emitEv[K]>} args
             */
            emit: ( event, ...args ) => {
                return new Promise(  (resolve) => {
                    this.#socket.to( room ).emit( event.toString(), ...args, reply =>
                        resolve( reply )
                    );
                } );
            },
            fetchSockets: () => this.#socket.to( room ).fetchSockets()
        };
    }
    
    // @type { { emit: ( event: K, ...args: Parameters<emitEvents[K]> ) => void } }
    
    get broadcast () {
        return {
            /**
             * @template {keyof emitEv} K
             * @param {K} event
             * @param {Parameters<emitEv[K]>} args
             * @returns {void}
             */
            emit: ( event, ...args ) => this.#socket.broadcast.emit.call( this.#socket, event, ...args )
        }
    }

    /**
     * @param {import("socket.io").Socket} socket 
     */
    constructor ( socket ) {

        this.#socket = socket;
        
    }
    
}

module.exports = ioTypedSocket;