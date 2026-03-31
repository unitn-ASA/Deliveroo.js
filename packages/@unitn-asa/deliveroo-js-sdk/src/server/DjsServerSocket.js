import { Socket } from 'socket.io';

/**
 * @typedef {import("../types/IOAgent.js").IOAgent} IOAgent
 * @typedef {import("../types/IOParcel.js").IOParcel} IOParcel
 * @typedef {import("../types/IOTile.js").IOTile} IOTile
 * @typedef {import("../types/IOConfig.js").IOConfig} IOConfig
 * @typedef {import("../types/IOInfo.js").IOInfo} IOInfo
 * 
 * @typedef {import("../types/IOSocketEvents.js").IOSensing} IOSensing
 * @typedef {import("../types/IOSocketEvents.js").IOClientEvents} IOClientEvents on the client side these are to be emitted with .emit
 * @typedef {import("../types/IOSocketEvents.js").IOServerEvents} IOServerEvents on the client side these are to be listened with .on
 */



/**
 * @class
 * @extends { Socket<IOClientEvents, IOServerEvents> }
 */
export class DjsServerSocket extends Socket {

    warnings = new Array();

    // /**
    //  * @template {keyof IOClientEvents} K
    //  * @param {K} event
    //  * @param {IOClientEvents[K]} listener
    //  * @returns {void}
    //  */
    on ( event, listener ) {
        return super.on( event, (...args) => {
            try {
                return listener.apply( this, args );
            } catch (error) {
                console.error( `WARN Socket ${this.id} on( ${String(event)}, ${args.slice(0,-1).join(', ')} ).`, error );
                // this.warnings.push( {
                //     msg: `WARN Socket ${this.id} on( ${String(event)}, ${args.slice(0,-1).join(', ')} ).`,
                //     error: error
                // } );
            }
        });
    }

    /**
     * @param { function() : void } callback
     */
    onDisconnect ( callback ) {
        super.on( 'disconnect', callback);
    }

    /**
     * @param { IOConfig } config
     */
    emitConfig ( config ) {
        super.emit( 'config', config );
    }

    /**
     * @param { number } width
     * @param { number } height
     * @param { IOTile [] } tiles
     */
    emitMap ( width, height, tiles ) {
        super.emit( 'map', width, height, tiles );
    }

    /**
     * @param { IOTile } tile
     */
    emitTile ( { x, y, type } ) {
        super.emit( 'tile', {x, y, type} );
    }

    /**
     * @param { 'connected'|'disconnected' } status
     * @param { Parameters<IOServerEvents['controller']>[1] } agent
     */
    emitController ( status, {id, name, teamId, teamName, score} ) {
        super.emit( 'controller', status, {id, name, teamId, teamName, score} );
    }
    
    /**
     * @param { IOAgent } you
     */
    emitYou ( {id, name, teamId, teamName, x, y, score, penalty} ) {
        super.emit( 'you', {id, name, teamId, teamName, x, y, score, penalty} );
    }

    /**
     * @param { IOSensing } sensing
     */
    emitSensing ( sensing ) {
        super.emit( 'sensing', sensing );
    }
    
    /**
     * @param { IOInfo } info
     */
    emitInfo ( info ) {
        super.emit( 'info', info );
    }



    /**
     * @callback onMoveCallback
     * @param { 'up' | 'right' | 'left' | 'down' } direction
     * @param { function( { x:number, y:number } | false ) : void } replyAcknowledgmentCallback ( reply )
     */
    /**
     * @param { onMoveCallback } callback ( direction, acknowledgementCallback )
     */
    onMove ( callback ) {
        super.on( 'move', callback );
    }
    
    /**
     * @callback onPickupCallback
     * @param { function( { id:string } [] ) : void } acknowledgementCallback
     */
    /**
     * @param { onPickupCallback } callback ( acknowledgementCallback )
     */
    onPickup ( callback ) {
        super.on( 'pickup', callback );
    }

    /**
     * @callback onPutdownCallback
     * @param { string [] } selected ids of parcels to drop
     * @param { function( { id:string } [] ) : void } acknowledgementCallback
     */
    /**
     * @param { onPutdownCallback } callback ( selected, acknowledgementCallback )
     */
    onPutdown ( callback ) {
        super.on( 'putdown', callback );
    }



    /**
     * @param { function ( string, any, function ( 'successful' ) : void ) : void } callback ( toId, msg, ack )
     */
    onSay ( callback ) {
        super.on( 'say', callback );
    }

    /**
     * @param { function ( string, any, function ( any ) : void ) : void } callback ( toId, msg, ack(reply) )
     */
    onAsk ( callback ) {
        super.on( 'ask', callback );
    }

    /**
     * @param { function ( any, function ( any ) : void ) : void } callback ( msg, ack(reply) )
     */
    onShout ( callback ) {
        super.on( 'shout', callback );
    }

    /**
     * @param { IOAgent } me
     * @param { string } toId
     * @param { {} } msg
     * @returns { Promise < any > } reply
     */
    async emitMsg ( me, toId, msg ) {
        return super.to( "agent:" + toId ).emit( 'msg', me.id, me.name, msg );
    }

    /**
     * @param { IOAgent } me
     * @param { string } toId
     * @param { {} } msg
     * @returns { Promise < any > } reply
     */
    async emitAsk ( me, toId, msg ) {
        
        // Currently, acks is awaited from all clients when .emit(), otherwise callback gets an error
        // https://github.com/socketio/socket.io/discussions/5062
        const sockets = await super.to( "agent:" + toId ).fetchSockets();
        const emissionPromises = sockets.map( socket => {
            return new Promise( (res) => {
                socket.timeout(1000).emit( 'msg', me.id, me.name, msg, (err, response) => {
                    if (err)
                        res('timeout');
                    else
                        res(response);
                } );
            } );
        } );

        // wait for first promise to resolve and ensure a timeout resolution in case all the responses are invalid
        const response = await Promise.race(
            emissionPromises.concat(new Promise(res => setTimeout(() => res('timeout'), 1000)))
        );

        return response;
    }

    /**
     * @param { any } msg
     * @returns { void } reply
     */
    broadcastMsg ( me, msg ) {
        super.broadcast.emit( 'msg', me.id, me.name, msg );
    }

    /**
     * @param { function ( ...any ) : void } callback ( ...msgArgs )
     */
    onLog ( callback ) {
        super.on( 'log', callback );
    }
    
    /**
     * @param { string } myId
     * @param { string } myName
     * @param { 'server' | { socket:string, id:string, name:string } } src - 'server' or client
     * @param { IOInfo } info
     * @param { ...any } message
     */
    broadcastLog ( myId, myName, src, info, ...message ) {
        super.broadcast.emit( 'log', src, info, ...message );
    }



    /**
     * Process request for creating a parcel on x, y or disposing or setting its reward given the id
     * @param { function ( 'create' | 'dispose' | 'set', {id:string, x:number, y:number, reward:number} ) : void } callback 
     */
    onParcel ( callback ) {
        super.on( 'parcel', callback );
    }

    /**
     * Process request for creating a tile on x, y or setting its type
     * @param { function ( IOTile ) : void } callback
     */
    onTile ( callback ) {
        super.on( 'tile', callback );
    }

    /**
     * Process request for restarting the game
     * @param { function () : void } callback
     */
    onRestart ( callback ) {
        super.on( 'restart', callback );
    }



    /**
     * Enhance a Socket.io Socket into a DjsSocket
     * @param { Socket } socket
     * @returns { DjsServerSocket }
     */
    static enhance(socket) {

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
        applyMixin(socket, DjsServerSocket);

        /**
         * Original socket enhanced with ClientSocketEnhancer methods casted as EnhancedSocket
         * @type { DjsServerSocket }
        */
    // @ts-ignore
        return socket;

    }

}




// import { Server } from 'socket.io';
// const ioserver = new Server();
// ioserver.listen( 3000 );
// ioserver.on( 'connection', ( socket ) => {
//     const enhancedSocket = enhanceServerSocket( socket );
//     enhancedSocket.onMove( ( direction ) => {
//         console.log( `Client ${enhancedSocket.id} moved ${direction}` );
//         return { success: true };
//     } );
// } );
