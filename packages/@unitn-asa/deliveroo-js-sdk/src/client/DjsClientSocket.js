import { Socket } from 'socket.io-client';

/**
 * @typedef {import("../types/IOAgent.js").IOAgent} IOAgent
 * @typedef {import("../types/IOParcel.js").IOParcel} IOParcel
 * @typedef {import("../types/IOTile.js").IOTile} IOTile
 * @typedef {import("../types/IOConfig.js").IOConfig} IOConfig
 * @typedef {import("../types/IOInfo.js").IOInfo} IOInfo
 * 
 * @typedef {import("../types/IOSocketEvents.js").IOSensing} IOSensing
 * @typedef {import("../types/IOSocketEvents.js").IOClientEvents} IOClientEvents
 * @typedef {import("../types/IOSocketEvents.js").IOServerEvents} IOServerEvents
 */



/**
 * @class
 * @extends { Socket<IOServerEvents, IOClientEvents> }
 */
export class DjsClientSocket extends Socket {

    /** @type { Promise < string > } */
    token = new Promise( (res) => {
        this.once( 'token', (token) => {
            // console.log( 'New token for ' + NAME + ': ' + token )
            res( token );
        } );
    } );
    
    /** @type { Promise < IOAgent > } */
    me = new Promise( (res) => {
        this.once( 'you', (agent, info) => {
            res( agent );
        } );
    } );
    
    /** @type { Promise } */
    config = new Promise( (res) => {
        this.once( 'config', (config) => {
            res( config );
        } );
    } );

    /** @type { Promise < { width:number, height:number, tiles: IOTile [] } > } */
    map = new Promise ( (res) => {
        this.once( 'map', (width, height, tiles) => {
            res( {width, height, tiles} );
        } );
    } );



    /**
     * @param { function() : void } callback 
     */
    onConnect ( callback ) {
        this.on( "connect", callback )
    }

    /**
     * @param { function() : void } callback 
     */
    onDisconnect ( callback ) {
        this.on( "disconnect", callback )
    }

    /**
     * @param { function(IOConfig) : void } callback
     */
    onConfig ( callback ) {
        this.on( "config", callback )
    }

    /**
     * @param { function( number, number, IOTile[] ) : void } callback ( width, height, tiles )
     */
    onMap ( callback ) {
        this.on( "map", callback )
    }
    
    /**
     * @param { function( IOTile ) : void } callback
     */
    onTile ( callback ) {
        this.on( "tile", callback )
    }

    // @param { serverEvents['controller']  } callback
    /**
     * @param { function( string, { id:string, name:string, teamId:string, teamName:string, score:number } ) : void } callback
     */
    onAgentConnected ( callback ) {
        this.on( "controller", callback )
    }
    
    /**
     * @param { function( IOAgent ) : void } callback
     */
    onYou ( callback ) {
        this.on( "you", callback )
    }

    /**
     * @param { function( IOAgent ) : void } callback
     */
    onceYou ( callback ) {
        this.once( "you", callback )
    }
    
    /**
     * Listen to 'sensing' events
     * @param { function( IOSensing ) : void } callback
     */
    onSensing ( callback ) {
        this.on( "sensing", callback )
    }
    
    /**
     * Listen to 'info' events
     * @param { function( IOInfo ) : void } callback
     */
    onInfo ( callback ) {
        this.on( "info", callback )
    }
    
    /**
     * @callback onMsgCallback
     * @param { string } id
     * @param { string } name
     * @param { {} } msg
     * @param { function( any ) : void } replyAcknowledgmentCallback ( reply )
     */
    /**
     * Listen to 'msg' events
     * @param {onMsgCallback} callback (id, name, msg, replyAcknowledgmentCallback)
     */
    onMsg ( callback ) {
        this.on( "msg", callback )
    }

    /**
     * @template T
     * @typedef {T extends [...infer _, infer L] ? L : never} Last
     */

    /**
     * @template T
     * @typedef {T extends [...infer R, any] ? R : T} AllButLast
     */

    /**
     * @template {keyof IOClientEvents} K
     * @param {K} event
     * @param {AllButLast<Parameters<IOClientEvents[K]>>} args
     * @returns {Promise<Last<Parameters<IOClientEvents[K]>>>}
     */
    // @ts-ignore
    async emitAndResolveOnAck ( event, ...args ) {
        // @ts-ignore
        return this.timeout( 1000 ).emitWithAck( event, ...args );
    }

    /**
     * @param {string} toId
     * @param {any} msg
     * @returns { Promise < 'successful' > } status
     */
    async emitSay ( toId, msg ) {
        return new Promise( (success) => {
            this.emit( 'say', toId, msg, async ( status ) =>  {
                success( status );
            } );
        } );
    }

    /**
     * @param {string} toId 
     * @param {any} msg 
     * @returns { Promise < { any } > } reply
     */
    async emitAsk ( toId, msg ) {
        return new Promise( (success) => {
            this.emit( 'ask', toId, msg, async ( reply ) =>  {
                success( reply );
            } );
        } );
    }

    async emitShout ( msg ) {
        return new Promise( (success) => {
            this.emit( 'shout', msg, async ( status ) =>  {
                success( status );
            } );
        } );
    }

    /**
     * When movement completes, it resolves to true.
     * In case of failure when moving, it resolves to false
     * @param { 'up' | 'right' | 'left' | 'down' } direction It can be either: 'up', 'right', 'left', 'down'
     * @returns { Promise < { x:number, y:number } | false > }
     */
    async emitMove ( direction ) {
        return this.emitAndResolveOnAck( 'move', direction );
    }

    /**
     * Pick up all parcels in the agent tile.
     * When completed, resolves to the array of picked up parcels
     * @returns { Promise < { id:string } [] > } array of picked up parcels
     */
    async emitPickup (  ) {
        return this.emitAndResolveOnAck( 'pickup' );
    }

    /**
     * Put down parcels:
     * - if array of ids is provided: putdown only specified parcels
     * - if no list is provided: put down all parcels
     * When completed, resolves to the list of dropped parcels
     * @param { string [] } selected array of parcels id to drop
     * @returns { Promise < { id:string } [] >}
     */
    async emitPutdown ( selected = null ) {
        return this.emitAndResolveOnAck( 'putdown', selected );
    }

    /**
     * @param { any [] } message
     */
    emitLog ( ...message ) {
        this.emit( "log", ...message );
    }
    
    /**
     * Listen to 'log' events from server and those redirected here from others client
     * @param { function ( { src:'server'|'client', ms:number, frame: number, socket:string, id:string, name:string }, ...any) : void } callback ( { src, ms, frame, socket, id, name }, ...msgArgs )
     */
    onLog ( callback ) {
        this.on( "log", callback )
    }



    /**
     * Enhance a Socket.io-client Socket into a DjsSocket
     * @param { Socket } socket
     * @returns { DjsClientSocket }
    */
    static enhance (socket) {

        /**
         * Mixin function to copy methods from a class prototype to an object
         */
        function applyMixin(target, MixinClass) {
            
            let proto = MixinClass.prototype;

            const descriptors = Object.getOwnPropertyDescriptors(proto);
            delete descriptors.constructor;
            
            Object.defineProperties(target, descriptors);

            return target;
        }
        applyMixin(socket, DjsClientSocket);

        /**
         * Original socket enhanced with ClientSocketEnhancer methods casted as EnhancedSocket
         * @type { DjsClientSocket }
        */
        // @ts-ignore
        return socket;

    }
}






// import io from 'socket.io-client';
// const host = 'http://localhost:8080';
// const opts = {
//     autoConnect: false,
//     withCredentials: false,
//     extraHeaders: { 'x-token': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImQzMDhhYiIsIm5hbWUiOiJwYW9sbyIsInRlYW1JZCI6IjYwNzA4ZCIsInRlYW1OYW1lIjoiZGlzaSIsInJvbGUiOiJ1c2VyIiwiaWF0IjoxNzQ4MzUzNTU4fQ.pzZxyGjv0WPbyh45Grr_sYqzGU1EUH-XK7hZEcWX5Js' },
//     // query: { name: 'marco' }
// };
// const socket = io( host, opts );
// const enhancedSocket = DjsClientSocket.enhance( socket );
// enhancedSocket.emitMove( 'up' ).then( ( result ) => {
//     console.log( 'Move result:', result );
// } );
// enhancedSocket.emitShout( 'hellooooo!' );
// enhancedSocket.onceYou( ( agent, info ) => {
//     console.log( 'enhanceClientSocket.js I am', agent, info );
// } );
// // enhancedSocket.emitAndResolveOnAck( 'putdown' ).then( ( ack ) => {
// //     console.log( 'Acknowledged with', ack );
// // } );
// enhancedSocket.connect();
