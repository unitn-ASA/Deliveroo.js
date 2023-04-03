import { io } from "socket.io-client";
import EventEmitter from "events";

export default class DeliverooApi extends EventEmitter {
    
    /** @type {Socket<DefaultEventsMap, DefaultEventsMap>} */
    socket;

    constructor ( host, token ) {

        super();

        let name = process.argv[2];

        let opts = {}
        if (name)
            opts.query = { name: name }
        else
            opts.extraHeaders = { 'x-token': token }

        const socket = this.socket = io( host, opts );
        
        socket.once( 'token', (token) => { console.log( 'New token for ' + name + ': ' + token ) } )

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
     * @returns {Promise<boolean>}
     */
    async move ( direction ) {
        return new Promise( (success, reject) => {
            this.socket.emit( 'move', direction, async (status) =>  {
                success( status );
            } );
        } );
    }

    /**
     * When completed, resolves to the list of picked up parcels
     * @returns {Promise<boolean>}
     */
    async pickup (  ) {
        return new Promise( (success) => {
            this.socket.emit( 'pickup', async ( picked ) =>  {
                success( picked );
            } );
        } );
    }

    /**
     * When completed, resolves to the list of dropped parcels
     * @returns {Promise<boolean>}
     * @param {[string]} selected list of parcels ids to drop
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

