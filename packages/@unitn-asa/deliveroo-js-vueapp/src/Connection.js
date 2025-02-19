import { ref, reactive, shallowReactive } from "vue";
import { default as io, Socket } from 'socket.io-client';
import { jwtDecode } from "jwt-decode";
import { Grid } from "./Grid.js";

var HOST = import.meta.env.VITE_SOCKET_IO_HOST || window.location.origin;

export class Connection {

    /**
     * @type {string} token
     */
    token;

    /**
     * @type {Object} payload
     */
    payload;

    /**
     * @type {Socket} socket
     */
    socket;

    /**
     * @type {{connected: boolean, events: Map<string,Array>}} state
     */
    state = reactive ({

        /**
         * @type {boolean}
         */
        connected: false,

        /**
         * @type {Map<string,Array>}
         */
        events: new Map()

    });

    /**
     * @type {Array<{timestamp:string, message:string[]}>} serverLog
     */
    serverLogs = shallowReactive (new Array());

    /**
     * @type {Array<{timestamp:string, socket:string, id:string, name:string, message:string[]}>} clientLogs
     */
    clientLogs = shallowReactive (new Array());

    /**
     * @type {import("vue").Ref<string>}
     */
    draw = ref();

    /**
     * @type {Array<{timestamp:string, socket:string, id:string, name:string, teamId:string, msg:string}>} clientLogs
     */
    msgs = shallowReactive (new Array());

    /**
     * @type {Object} configs
     */
    configs = reactive ({});

    /**
     * @type {Grid} grid
     */
    grid;

    listenAndRegister ( event ) {
        this.state.events.set(event, []);
        this.socket.on( event, (...args) => {
            this.state.events.get(event).push(args);
        });
    }

    connect () {
        console.log( "Connection.connect() connecting to", HOST, "with token:", this.token.slice(0,10)+'...' );
        return this.socket.connect();
    }

    disconnect () {
        return this.socket.disconnect();
    }
    
    connected () {
        return this.state.connected;
    }

    /**
     * Socket constructor
     * @param {string} token
     */
    constructor ( token ) {

        try {
            this.token = token;
            this.payload = jwtDecode( token );
        } catch (error) {
            console.error( 'Connection.js Invalid token', token, error );
        }

        const socket = this.socket = io( HOST, {
            autoConnect: false,
            withCredentials: false,
            extraHeaders: { 'x-token': token }
            // query: { name: name }
            // path: '/'
        } );

        this.grid = new Grid( socket );

        socket.on( "connect", () => {
            // console.log( "Connection.js Socket.on('connect') CONNECTED!" );
            this.state.connected = true;
            // document.getElementById('socket.id').textContent = `socket.id ${this.socket.id}`
        } );

        socket.on( "disconnect", (reason) => {
            console.log( `Connection.js Socket.on('disconnect') token: ${this.token.slice(0,10)}...` );
            this.state.connected = false;
            // if (reason === "io server disconnect") {
            //     // the disconnection was initiated by the server, you need to reconnect manually
            //     alert( `socket disconected` );
            //     window.location.href = '/home';
            // }
        } );
        
        this.listenAndRegister( "log" );
        this.listenAndRegister( "draw" );
        this.listenAndRegister( "not_tile" );
        this.listenAndRegister( "tile" );
        this.listenAndRegister( "map" );
        this.listenAndRegister( "msg" );
        this.listenAndRegister( "path" );
        this.listenAndRegister( "config" );
        this.listenAndRegister( "you" );
        this.listenAndRegister( "agents sensing" );
        this.listenAndRegister( "parcels sensing" );

        socket.on( 'log', ( {src, timestamp, socket, id, name}, ...message ) => {
            if ( src == 'server' )
                this.serverLogs.push( {timestamp, message} );
            else
                this.clientLogs.push( {timestamp, socket, id, name, message} );
        } );

        this.socket.on( 'draw', ( {src, timestamp, socket, id, name}, buffer ) => {
            // console.log( 'draw', {src, timestamp, socket, id, name}, buffer )
            this.draw.value = buffer;
        } );

        this.socket.on( "msg", ( id, name, teamId, msg, reply ) => {
            // console.log( 'CLIENT: msg', {id, name, teamId, msg, reply} )
            if ( msg == 'who are you?' && reply ) reply('I am the web app')

            this.msgs.push( {
                timestamp: new Date().toISOString(),
                socket: this.socket.id,
                id,
                name,
                teamId,
                msg
            } );

        })

        this.socket.on( "config", ( config ) => {
            // document.getElementById('config').textContent = JSON.stringify( config, undefined, 2 );
            for ( let [key,value] of Object.entries(config) ) {
                this.configs[key] = value;
            }
        } )

        // console.log( 'Connection.js', this );

    }

}
