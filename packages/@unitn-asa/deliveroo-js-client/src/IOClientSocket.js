import { IOTypedSocketClient } from '@unitn-asa/types';

/**
 * @typedef {import("@unitn-asa/types").IOAgent} IOAgent
 * @typedef {import("@unitn-asa/types").IOParcel} IOParcel
 * @typedef {import("@unitn-asa/types").IOTile} IOTile
 * @typedef {import("@unitn-asa/types").IOInfo} IOInfo
 */



/**
 * @class ioClientInterface
 * @extends { IOTypedSocketClient }
 */
export class IOClientSocket extends IOTypedSocketClient {

    /** @type { Promise < string > } */
    token;
    
    /** @type { Promise < IOAgent > } */
    me;
    
    /** @type { Promise } */
    config;

    /** @type { Promise < { width:number, height:number, tiles: IOTile [] } > } */
    map;

    /**
     * @param { IOTypedSocketClient.IOTypedSocketClientSocket } socket 
     */
    constructor ( socket ) {

        super( socket );

        this.socket = socket;
        
        this.token = new Promise( (res) => {
            this.socket.once( 'token', (token) => {
                // console.log( 'New token for ' + NAME + ': ' + token )
                res( token );
            } );
        } );

        this.me = new Promise( (res) => {
            this.once( 'you', (agent, info) => {
                res( agent );
            } );
        } );

        this.config = new Promise( (res) => {
            this.once( 'config', (config) => {
                res( config );
            } );
        } );

        this.map = new Promise ( (res) => {
            this.once( 'map', (width, height, tiles) => {
                res( {width, height, tiles} );
            } );
        } );

    }

    connect () {
        // console.log( "Connection.connect() connecting to", HOST, "with token:", this.token.slice(0,10)+'...' );
        return this.socket.connect();
    }

    disconnect () {
        return this.socket.disconnect();
    }

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
     * @param { function(any) : void } callback
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
     * @param { function( IOTile, IOInfo ) : void } callback
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
     * @param { function( IOAgent, IOInfo ) : void } callback
     */
    onYou ( callback ) {
        this.on( "you", callback )
    }

    /**
     * @param { function( IOAgent, IOInfo ) : void } callback
     */
    onceYou ( callback ) {
        this.once( "you", callback )
    }
    
    /**
     * Listen to 'agents sensing' events
     * @param { function( IOAgent [] ) : void } callback 
     */
    onAgentsSensing ( callback ) {
        this.on( "agents sensing", callback )
    }
    
    /**
     * Listen to 'parcels sensing' events
     * @param { function( IOParcel [] ) : void } callback 
     */
    onParcelsSensing ( callback ) {
        this.on( "parcels sensing", callback )
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
     * @param { 'up' | 'right' | 'left' | 'down' | { x:number, y:number } } directionOrXy It can be either: 'up', 'right', 'left', 'down', or destination Xy
     * @returns { Promise < { x:number, y:number } | false > }
     */
    async emitMove ( directionOrXy ) {
        return this.emitAndResolveOnAck( 'move', directionOrXy );
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

}

