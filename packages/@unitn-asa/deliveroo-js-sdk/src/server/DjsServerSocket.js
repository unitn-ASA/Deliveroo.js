import { Socket } from 'socket.io';

/**
 * @typedef {import("../types/IOAgent.js").IOAgent} IOAgent
 * @typedef {import("../types/IOParcel.js").IOParcel} IOParcel
 * @typedef {import("../types/IOTile.js").IOTile} IOTile
 * @typedef {import("../types/IOConfig.js").IOConfig} IOConfig
 * @typedef {import("../types/IOMetrics.js").IOMetrics} IOMetrics
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

    // warnings = new Array();


    // /**
    //  * Override to add type safety and error handling for event listeners
    //  * @param {string} room 
    //  * @returns { BroadcastOperator<DecorateAcknowledgementsWithMultipleResponses<IOServerEvents>, any> }
    //  */
    // to ( room ) {
    //     return super.to( room );
    // }



    /**
     * @template {keyof IOClientEvents} K
     * @param {K} event
     * @param {IOClientEvents[K]} listener
     * @returns {void}
     */
    // @ts-ignore
    on ( event, listener ) {
        // @ts-ignore
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
     * @param { IOClientEvents['disconnect'] } callback
     */
    onDisconnect ( callback ) {
        super.on( 'disconnect', callback);
    }

    /**
     * @type { IOServerEvents['config'] }
     */
    emitConfig ( config ) {
        super.emit( 'config', config );
    }

    /**
     * @type { IOServerEvents['map'] }
     */
    emitMap ( width, height, tiles ) {
        super.emit( 'map', width, height, tiles );
    }

    /**
     * @type { IOServerEvents['tile'] }
     */
    emitTile ( { x, y, type } ) {
        super.emit( 'tile', {x, y, type} );
    }

    /**
     * @type { IOServerEvents['controller'] }
     */
    emitController ( status, {id, name, teamId, teamName, score} ) {
        super.emit( 'controller', status, {id, name, teamId, teamName, score} );
    }
    
    /**
     * @type { IOServerEvents['you'] }
     */
    emitYou ( {id, name, teamId, teamName, x, y, score, penalty, rotation} ) {
        super.emit( 'you', {id, name, teamId, teamName, x, y, score, penalty, rotation} );
    }

    /**
     * @type { IOServerEvents['sensing'] }
     */
    emitSensing ( sensing ) {
        super.emit( 'sensing', sensing );
    }
    
    /**
     * @type { IOServerEvents['metrics'] }
     */
    emitMetrics ( metrics ) {
        super.emit( 'metrics', metrics );
    }
    
    /**
     * @type { IOServerEvents['log'] }
     */
    emitLog ( source, ...msg ) {
        super.emit( 'log', source, ...msg );
    }



    /**
     * @param { IOClientEvents['move'] } callback
     */
    onMove ( callback ) {
        super.on( 'move', callback );
    }
    
    /**
     * @param { IOClientEvents['pickup'] } callback
     */
    onPickup ( callback ) {
        super.on( 'pickup', callback );
    }

    /**
     * @param { IOClientEvents['putdown'] } callback
     */
    onPutdown ( callback ) {
        super.on( 'putdown', callback );
    }



    /**
     * @param { IOClientEvents['say'] } callback ( toId, msg, ack )
     */
    onSay ( callback ) {
        super.on( 'say', callback );
    }

    /**
     * @param { IOClientEvents['ask'] } callback ( toId, msg, ack(reply) )
     */
    onAsk ( callback ) {
        super.on( 'ask', callback );
    }

    /**
     * @param { IOClientEvents['shout'] } callback ( msg, ack(reply) )
     */
    onShout ( callback ) {
        super.on( 'shout', callback );
    }

    /**
     * @param { string } fromId
     * @param { string } fromName
     * @param { string } toId
     * @param { any } msg
     */
    emitMsg ( fromId, fromName, toId, msg ) {
        super.to( "agent:" + toId ).emit( 'msg', fromId, fromName, msg );
    }

    /**
     * @param { string } fromId
     * @param { string } fromName
     * @param { string } toId
     * @param { any } msg
     * @returns { Promise < any > } reply
     */
    async emitAsk ( fromId, fromName, toId, msg ) {
        
        // Currently, acks is awaited from all clients when .emit(), otherwise callback gets an error
        // https://github.com/socketio/socket.io/discussions/5062
        const sockets = await super.to( "agent:" + toId ).fetchSockets();
        const emissionPromises = sockets.map( socket => {
            return new Promise( (res) => {
                // @ts-ignore
                socket.timeout(1000).emit( 'msg', fromId, fromName, msg, (err, response) => {
                    if (err)
                        res('timeout');
                    else
                        res(response);
                } );
            } );
        } );
        // add a timeout promise to ensure we don't wait indefinitely in case of no response
        emissionPromises.concat(new Promise(res => setTimeout(() => res('timeout'), 1000)))

        // wait for first promise to resolve (either a response or timeout)
        const response = await Promise.race( emissionPromises );

        return response;
    }

    /**
     * @param { string } fromId
     * @param { string } fromName
     * @param { any } msg
     * @returns { void } reply
     */
    broadcastMsg ( fromId, fromName, msg ) {
        super.broadcast.emit( 'msg', fromId, fromName, msg );
    }

    /**
     * @param { function ( ...any ) : void } callback ( ...msgArgs )
     */
    onLog ( callback ) {
        super.on( 'log', callback );
    }
    
    /**
     * @param { 'server' | { socket:string, id:string, name:string } } src - 'server' or client
     * @param { ...any } message
     */
    broadcastLog ( src, ...message ) {
        super.broadcast.emit( 'log', src, ...message );
    }



    /**
     * Process request for creating a parcel on x, y or disposing or setting its reward given the id
     * @param { IOClientEvents['parcel'] } callback 
     */
    onParcel ( callback ) {
        super.on( 'parcel', callback );
    }

    /**
     * Process request for creating a tile on x, y or setting its type
     * @param { IOClientEvents['tile'] } callback
     */
    onTile ( callback ) {
        super.on( 'tile', callback );
    }

    /**
     * Process request for restarting the game
     * @param { IOClientEvents['restart'] } callback
     */
    onRestart ( callback ) {
        super.on( 'restart', callback );
    }

    /**
     * Process request for rewarding an agent with a certain amount of points
     * @param { IOClientEvents['reward'] } callback
     */
    onReward ( callback ) {
        super.on( 'reward', callback );
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
        // @ts-ignore
        function applyMixin(target, MixinClass) {
            
            let proto = MixinClass.prototype;

            const descriptors = Object.getOwnPropertyDescriptors(proto);
            // @ts-ignore
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
