import { io } from "socket.io-client";
import EventEmitter from "events";

export default class DeliverooApi extends EventEmitter {
    
    /** @type {Socket<DefaultEventsMap, DefaultEventsMap>} */
    socket;

    constructor ( host, token ) {

        super();

        this.socket = io( host, {
            extraHeaders: {
                'x-token': token
            },
            // query: {
            //     name: "scripted",
            // }
        });

        this.socket.on( "you", ({id, name, x, y, score} ) => {
            this.emit( "you", {id, name, x, y, score} )
        });

        this.socket.on( "connect", (...args) => {
            this.emit( "connect", ...args)
        });

        this.socket.on( "disconnect", (...args) => {
            this.emit( "disconnect", ...args)
        });

        this.socket.on( "msg", (id, name, msg, reply) => {
            this.emit( "msg", id, name, msg, reply)
        });

    }

    /**
     * Resolves after timeout
     * @type {function(Number):Promise} timer
     */
    async timer ( ms ) {
        return new Promise( res => setTimeout( res, ms ) );
    }

    async move ( direction ) {
        console.log('movement')
        return new Promise( (success, reject) => {
            this.socket.emit( 'move', direction, async (status) =>  {
                success( status );
            } );
        } );
    }

    async pickup (  ) {
        return new Promise( (success) => {
            this.socket.emit( 'pickup', async ( picked ) =>  {
                success( picked );
            } );
        } );
    }

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

