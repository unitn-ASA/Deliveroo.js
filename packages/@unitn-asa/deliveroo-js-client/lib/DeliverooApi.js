import { io } from "socket.io-client";
import EventEmitter from "events";
import { default as argsParser } from "args-parser";

const args = argsParser(process.argv);
let NAME = args['name'];
let TOKEN = args['token'];
let HOST = args['host'];

/**
 * Takes the following arguments from console:
 * token or name
 * e.g:
 * $ node index.js -token=... -name=marco
 */
export default class DeliverooApi extends EventEmitter {
    
    /** @type {Socket<DefaultEventsMap, DefaultEventsMap>} */
    socket;
    token;
    id;
    name;
    config;
    /** @type { { width:number, height:number, tiles:[{x,y,delivery}] } } */
    map;

    constructor ( host, token ) {

        super();

        let opts = {}
        if (NAME)
            opts.query = { name: NAME }
        else
            opts.extraHeaders = { 'x-token': TOKEN || token }

        const socket = this.socket = io( HOST || host, opts );
        
        this.token = token;
        socket.once( 'token', (token) => {
            this.token = token;
            console.log( 'New token for ' + NAME + ': ' + token )
        } );

        socket.once( 'you', ({id, name}) => {
            this.id = id;
            this.name = name;
        } );
        
        socket.once( 'config', (config) => {
            this.config = config;
        } );

        socket.once( 'map', (width, height, tiles) => {
            this.map = {width, height, tiles};
            // console.log( 'map', width, height, tiles );
        } )

        /**
         * Bradcast log
         */
        const oldLog = console.log;
        console.log = function ( ...message ) {
            socket.emit( 'log', ...message );
            oldLog.apply( console, message );
        };

    }
    

    
    /**
     * @param { function(...) } callback 
     */
    onConnect ( callback ) {
        this.socket.on( "connect", callback )
    }

    /**
     * @param { function(...) } callback 
     */
    onDisconnect ( callback ) {
        this.socket.on( "disconnect", callback )
    }


    
    /**
     * @param { function( x, y, delivery ) } callback
     */
    onTile ( callback ) {
        this.socket.on( "tile", callback )
    }

    /**
     * @param { function( x, y ) } callback
     */
    onNotTile ( callback ) {
        this.socket.on( "not_tile", callback )
    }
    
    /**
     * @param { function( width, height, [{x, y, delivery}] ) } callback
     */
    onMap ( callback ) {
        this.socket.on( "map", callback )
    }
    
    /**
     * Listen to 'you' events
     * @param {function({id:string, name:string, x:number, y:number, score:number})} callback 
     */
    onYou ( callback ) {
        this.socket.on( "you", callback )
    }
    
    /**
     * Listen to 'agents sensing' events
     * @param { function( [ { id:string, name:string, x:number, y:number, score:number } ] ) } callback 
     */
    onAgentsSensing ( callback ) {
        this.socket.on( "agents sensing", callback )
    }
    
    /**
     * Listen to 'parcels sensing' events
     * @param { function( [ { id:string, x:number, y:number, carriedBy:string, reward:number } ] ) } callback 
     */
    onParcelsSensing ( callback ) {
        this.socket.on( "parcels sensing", callback )
    }
    
    /**
     * @callback onMsgCallback
     * @param {string} id
     * @param {string} name
     * @param {string} msg
     * @param {function(string)} replyAcknowledgmentCallback
     */
    /**
     * Listen to 'msg' events
     * @param {onMsgCallback} callback (id, name, msg, replyAcknowledgmentCallback)
     */
    onMsg ( callback ) {
        this.socket.on( "msg", callback )
    }
    
    

    /**
     * Listen to 'log' events from server and those redirected here from others client 
     * @type {function({src:'server'|'client', timestamp:number, socket:string, id:string, name:string}, ...message):void} 
     */
    onLog ( callback ) {
        this.socket.on( "log", callback )
    }
    
    

    /**
     * Listen to 'config' events from server
     * @type {function(config):void} 
     */
    onConfig ( callback ) {
        this.socket.on( "config", callback )
    }

    

    /**
     * Resolves after timeout
     * @type {function(Number):Promise} timer
     */
    async timer ( ms ) {
        return new Promise( res => setTimeout( res, ms ) );
    }



    /**
     * When movement completes, it resolves to true.
     * In case of failure when moving, it resolves immediately to false
     * @param {string} direction It can be either: 'up', 'right', 'left', or 'down'
     * @returns {Promise<{x:number,y:number}|'false'>}
     */
    async move ( direction ) {
        return new Promise( (success, reject) => {
            this.socket.emit( 'move', direction, async (status) =>  {
                success( status );
            } );
        } );
    }

    /**
     * Pick up all parcels in the agent tile.
     * When completed, resolves to the array of picked up parcels
     * @returns {Promise<[integer]>}
     */
    async pickup (  ) {
        return new Promise( (success) => {
            this.socket.emit( 'pickup', async ( picked ) =>  {
                success( picked );
            } );
        } );
    }

    /**
     * Put down parcels:
     * - if array of ids is provided: putdown only specified parcels
     * - if no list is provided: put down all parcels
     * When completed, resolves to the list of dropped parcels
     * @returns {Promise<[integer]>}
     * @param {[string]} selected array of parcels id to drop
     */
    async putdown ( selected = null ) {
        return new Promise( (success) => {
            this.socket.emit( 'putdown', selected, async ( dropped ) =>  {
                success( dropped );
            } );
        } );
    }

    async say ( toId, msg ) {
        return new Promise( (success) => {
            this.socket.emit( 'say', toId, msg, async ( status ) =>  {
                success( status );
            } );
        } );
    }

    async ask ( toId, msg ) {
        return new Promise( (success) => {
            this.socket.emit( 'ask', toId, msg, async ( reply ) =>  {
                success( reply );
            } );
        } );
    }

    async shout ( msg ) {
        return new Promise( (success) => {
            this.socket.emit( 'shout', msg, async ( status ) =>  {
                success( status );
            } );
        } );
    }

}

