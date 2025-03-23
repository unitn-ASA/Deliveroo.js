const myClock = require('./myClock');
const ioTypedSocket = require('@unitn-asa/deliveroo-js-client/types/ioTypedSocket.cjs');

/**
 * @typedef agent
 * @type {import("@unitn-asa/deliveroo-js-client/types/ioTypedSocket.cjs").agent}
 */

/**
 * @typedef parcel
 * @type {import("@unitn-asa/deliveroo-js-client/types/ioTypedSocket.cjs").parcel}
 */

/**
 * @typedef tile
 * @type {import("@unitn-asa/deliveroo-js-client/types/ioTypedSocket.cjs").tile}
 */

/**
 * @typedef timestamp
 * @type {import("@unitn-asa/deliveroo-js-client/types/ioTypedSocket.cjs").timestamp}
 */

/**
 * @typedef clientEvents on the server side these are to be listened with .on
 * @type {import("@unitn-asa/deliveroo-js-client/types/ioTypedSocket.cjs").clientEvents}
 */

/**
 * @typedef serverEvents on the server side these are to be emitted with .emit
 * @type {import("@unitn-asa/deliveroo-js-client/types/ioTypedSocket.cjs").serverEvents}
 */



/**
 * @class ioServerInterface
 * @extends { ioTypedSocket<clientEvents, serverEvents> }
 */
class ioServerSocket extends ioTypedSocket {

    warnings = new Array();

    /**
     * @param {import("socket.io").Socket} socket 
     */
    constructor ( socket ) {

        super( socket );
        
    }

    /**
     * @template {keyof clientEvents} K
     * @param {K} event
     * @param {clientEvents[K]} listener
     * @returns {void}
     */
    on ( event, listener ) {
        return super.on( event, (...args) => {
            try {
                return listener.apply( this, args );
            } catch (error) {
                console.error( `WARN Socket ${this.id} on( ${event}, ${args.slice(0,-1).join(', ')} ).`, error );
                this.warnings.push( {
                    msg: `WARN Socket ${this.id} on( ${event}, ${args.slice(0,-1).join(', ')} ).`,
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
        this.emit( 'config', config );
    }

    /**
     * @param { number } width
     * @param { number } height
     * @param { tile [] } tiles
     */
    emitMap ( width, height, tiles ) {
        this.emit( 'map', width, height, tiles );
    }

    /**
     * @param { tile } tile
     */
    emitTile ( { x, y, type } ) {
        this.emit( 'tile', {x, y, type}, {ms: myClock.ms, frame:myClock.frame} );
    }

    /**
     * @param { 'connected'|'disconnected' } status
     * @param { Parameters<serverEvents['controller']>[1] } agent
     */
    emitController ( status, {id, name, teamId, teamName, score} ) {
        this.emit( 'controller', status, {id, name, teamId, teamName, score} );
    }
    
    /**
     * @param { agent } you
     */
    emitYou ( {id, name, teamId, teamName, x, y, score, penalty} ) {
        this.emit( 'you', {id, name, teamId, teamName, x, y, score, penalty}, {ms: myClock.ms, frame: myClock.frame} );
    }

    /**
     * @param { agent [] } agents
     */
    emitAgentsSensing ( agents ) {
        this.emit( 'agents sensing', agents, {ms: myClock.ms, frame: myClock.frame} );
    }
    
    /**
     * @param { parcel [] } parcels
     */
    emitParcelSensing ( parcels ) {
        this.emit( 'parcels sensing', parcels, {ms: myClock.ms, frame: myClock.frame} );
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
     * @param { agent } me
     * @param { string } toId
     * @param { {} } msg
     * @returns { Promise < any > } reply
     */
    async emitMsg ( me, toId, msg ) {
        return this.to( "agent:" + toId ).emit( 'msg', me.id, me.name, msg );
    }

    /**
     * @param { any } msg
     * @returns { void } reply
     */
    broadcastMsg ( me, msg ) {
        this.broadcast.emit( 'msg', me.id, me.name, msg );
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
     * @param { ...any } message
     */
    broadcastLog ( myId, myName, src, ...message ) {
        this.broadcast.emit( 'log', {
            src,
            ms: myClock.ms,
            frame: myClock.frame,
            socket: this.id,
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
     * @param { function ( tile ) : void } callback
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


module.exports = ioServerSocket;