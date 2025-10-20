import { IOServer } from './generics/IOServer.js';

/**
 * @typedef {import("@unitn-asa/deliveroo-js-sdk").IOAgent} IOAgent
 * @typedef {import("@unitn-asa/deliveroo-js-sdk").IOParcel} IOParcel
 * @typedef {import("@unitn-asa/deliveroo-js-sdk").IOTile} IOTile
 * @typedef {import("@unitn-asa/deliveroo-js-sdk").IOInfo} IOInfo
 * 
 * @typedef {import("@unitn-asa/deliveroo-js-sdk").IOClientEvents} IOClientEvents on the server side these are to be listened with .on
 * @typedef {import("@unitn-asa/deliveroo-js-sdk").IOServerEvents} IOServerEvents on the server side these are to be emitted with .emit
 */

/**
 * @typedef {import("socket.io").Socket< IOClientEvents, IOServerEvents >} IODeliveroojsServerSocket
 */



/**
 * @class ioServerInterface
 * @extends { IOServer<IOClientEvents, IOServerEvents> }
 */
export class IODeliveroojsServer extends IOServer {

    warnings = new Array();

    /**
     * @param {IODeliveroojsServerSocket} socket 
     */
    constructor ( socket ) {

        super( socket );
        
    }

    /**
     * @template {keyof IOClientEvents} K
     * @param {K} event
     * @param {IOClientEvents[K]} listener
     * @returns {void}
     */
    on ( event, listener ) {
        return super.on( event, (...args) => {
            try {
                return listener.apply( this, args );
            } catch (error) {
                console.error( `WARN Socket ${super.socket.id} on( ${String(event)}, ${args.slice(0,-1).join(', ')} ).`, error );
                this.warnings.push( {
                    msg: `WARN Socket ${super.socket.id} on( ${String(event)}, ${args.slice(0,-1).join(', ')} ).`,
                    error: error
                } );
            }
        });
    }

    /**
     * @param { function() : void } callback
     */
    onDisconnect ( callback ) {
        this.on( 'disconnect', callback);
    }

    /**
     * @param { {} } config
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
     * @param { IOInfo } info
     */
    emitTile ( { x, y, type }, info ) {
        super.emit( 'tile', {x, y, type}, info );
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
     * @param { IOInfo } info
     */
    emitYou ( {id, name, teamId, teamName, x, y, score, penalty}, info ) {
        super.emit( 'you', {id, name, teamId, teamName, x, y, score, penalty}, info );
    }

    /**
     * @param { IOAgent [] } agents
     * @param { IOInfo } info
     */
    emitAgentsSensing ( agents, info ) {
        super.emit( 'agents sensing', agents, info );
    }
    
    /**
     * @param { IOParcel [] } parcels
     * @param { IOInfo } info
     */
    emitParcelSensing ( parcels, info ) {
        super.emit( 'parcels sensing', parcels, info );
    }



    /**
     * @callback onMoveCallback
     * @param { 'up' | 'right' | 'left' | 'down' | { x:number, y:number } } directionOrXy
     * @param { function( { x:number, y:number } | false ) : void } replyAcknowledgmentCallback ( reply )
     */
    /**
     * @param { onMoveCallback } callback ( direction, acknowledgementCallback )
     */
    onMove ( callback ) {
        this.on( 'move', callback );
    }
    
    /**
     * @callback onPickupCallback
     * @param { function( { id:string } [] ) : void } acknowledgementCallback
     */
    /**
     * @param { onPickupCallback } callback ( acknowledgementCallback )
     */
    onPickup ( callback ) {
        this.on( 'pickup', callback );
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
        this.on( 'putdown', callback );
    }



    /**
     * @param { function ( string, any, function ( 'successful' ) : void ) : void } callback ( toId, msg, ack )
     */
    onSay ( callback ) {
        this.on( 'say', callback );
    }

    /**
     * @param { function ( string, any, function ( any ) : void ) : void } callback ( toId, msg, ack(reply) )
     */
    onAsk ( callback ) {
        this.on( 'ask', callback );
    }

    /**
     * @param { function ( any, function ( any ) : void ) : void } callback ( msg, ack(reply) )
     */
    onShout ( callback ) {
        this.on( 'shout', callback );
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
        this.on( 'log', callback );
    }
    
    /**
     * @param { string } myId
     * @param { string } myName
     * @param { 'server'|'client' } src
     * @param { IOInfo } info
     * @param { ...any } message
     */
    broadcastLog ( myId, myName, src, info, ...message ) {
        super.broadcast.emit( 'log', {
            src,
            ms: info.ms,
            frame: info.frame,
            socket: super.socket.id,
            id: myId,
            name: myName
        }, ...message );
    }



    /**
     * Process request for creating a parcel on x, y or disposing or setting its reward given the id
     * @param { function ( 'create' | 'dispose' | 'set', {id:string, x:number, y:number, reward:number} ) : void } callback 
     */
    onParcel ( callback ) {
        this.on( 'parcel', callback );
    }

    /**
     * Process request for creating a tile on x, y or setting its type
     * @param { function ( IOTile ) : void } callback
     */
    onTile ( callback ) {
        this.on( 'tile', callback );
    }

    /**
     * Process request for restarting the game
     * @param { function () : void } callback
     */
    onRestart ( callback ) {
        this.on( 'restart', callback );
    }

}
