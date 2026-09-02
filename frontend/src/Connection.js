import { ref, reactive, shallowReactive } from "vue";
import { default as io, Socket } from 'socket.io-client';
import { jwtDecode } from "jwt-decode";
import { Grid } from "./Grid.js";
import { DjsClientSocket } from "@unitn-asa/deliveroo-js-sdk/client";

/** @typedef {import('@unitn-asa/deliveroo-js-sdk/types/IOConfig.js').IOConfig} IOConfig */
/** @typedef {import("@unitn-asa/deliveroo-js-sdk/types/IOSocketEvents.js").IOMetrics} IOMetrics */

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
     * @type {DjsClientSocket} ioClient
     */
    ioClient;

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
     * @type {Array<{message:string[]}>} serverLog
     */
    serverLogs = shallowReactive (new Array());

    /**
     * @type {Array<{socket:string, id:string, name:string, message:string[]}>} clientLogs
     */
    clientLogs = shallowReactive (new Array());

    /**
     * @type {import("vue").Ref<string>}
     */
    draw = ref();

    /**
     * @type {Array<{msgId: number, timestamp:number, socket:string, id:string, name:string, msg:string}>} clientLogs
     */
    msgs = shallowReactive (new Array());
    msgId = 0; // Incremental ID for messages

    /** @type {import("vue").Ref<IOMetrics>} */
    metrics = ref();

    /** @type {import("vue").Ref<{frame: number, roundTrip: number}>} */
    latency = ref();

    /** @type {import("vue").Ref<number>} */
    serverFrame = ref(0);

    /** @type {import("vue").Ref<number>} */
    sensingPerFrame = ref(0);

    /**
     * @type {IOConfig} configs
     */
    // @ts-ignore
    configs = reactive ({});

    /**
     * @type {Grid} grid
     */
    grid;

    listenAndRegister ( event ) {
        this.state.events.set(event, []);
        this.ioClient.on( event, (...args) => {
            const eventArray = this.state.events.get(event);
            eventArray.push(args);
            // Limit array size to prevent memory leak - keep last 1000 events
            if ( eventArray.length > 1000 ) {
                eventArray.shift();
            }
            // console.log( `Connection.js Socket.on('${event}')`, args );
        });
    }

    connect () {
        console.log( "Connection.connect() connecting to", HOST, "with token:", this.token.slice(0,10)+'...' );
        return this.ioClient.connect();
    }

    disconnect () {
        return this.ioClient.disconnect();
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
            console.error( 'Connection.js Invalid token specified:', token, error );
        }

        const rawSocket = io( HOST, {
                autoConnect: false,
                withCredentials: false,
                extraHeaders: { 'x-token': token }
                // query: { name: name }
                // path: '/'
            } )
        const ioClient = this.ioClient = DjsClientSocket.enhance( /** @type {any} */ (rawSocket) );

        // socket.onAny( ( event, ...args ) => {
        //     console.log( `on('${event}')`, ...args );
        // } );

        this.grid = new Grid( ioClient );

        ioClient.on( "connect", () => {
            // console.log( "Connection.js Socket.on('connect') CONNECTED!" );
            this.state.connected = true;
            // document.getElementById('socket.id').textContent = `socket.id ${this.socket.id}`
        } );

        ioClient.on( "disconnect", (reason) => {
            console.log( `Connection.js Socket.on('disconnect') token: ${this.token.slice(0,10)}...` );
            this.state.connected = false;
            // if (reason === "io server disconnect") {
            //     // the disconnection was initiated by the server, you need to reconnect manually
            //     alert( `socket disconected` );
            //     window.location.href = '/home';
            // }
        } );
        
        this.listenAndRegister( "log" );
        this.listenAndRegister( "tile" );
        this.listenAndRegister( "map" );
        this.listenAndRegister( "msg" );
        this.listenAndRegister( "path" );
        this.listenAndRegister( "config" );
        this.listenAndRegister( "you" );
        this.listenAndRegister( "agents sensing" );
        this.listenAndRegister( "parcels sensing" );

        ioClient.on( 'log', ( src, ...message ) => {

            // this.grid.clock.ms = ms;
            // this.grid.clock.frame = frame;

            if ( src === 'server' ) {
                console.log( 'LOG from server:', ...message );
            } else {
                console.log( `LOG from client ${src.name}(${src.id}):`, ...message );
            }

            if ( src == 'server' ) {
                this.serverLogs.push( { message } );
                // Limit array size to prevent memory leak - keep last 1000 logs
                if ( this.serverLogs.length > 1000 ) {
                    this.serverLogs.shift();
                }
            } else {
                this.clientLogs.push( { socket: src.socket, id: src.id, name: src.name, message} );
                // Limit array size to prevent memory leak - keep last 1000 logs
                if ( this.clientLogs.length > 1000 ) {
                    this.clientLogs.shift();
                }
            }
        } );

        ioClient.on( "msg", ( id, name, msg, reply ) => {
            // console.log( 'CLIENT: msg', {id, name, msg, reply} )
            if ( msg == 'who are you?' && reply ) reply('I am the web app')

            // Add new message at end (oldest-first) - O(1) operation
            this.msgs.push( {
                msgId: this.msgId++,
                timestamp: Date.now(),
                socket: this.ioClient.id,
                id,
                name,
                msg
            } );

            // Role-based message limits to optimize admin performance
            // Admins see ALL messages from ALL agents, so use smaller limit
            // const MAX_MSGS_ADMIN = 200;  // Reduced from 1000 for admins
            // const MAX_MSGS_AGENT = 100;  // For regular agents
            // const limit = this.payload?.role === 'admin' ? MAX_MSGS_ADMIN : MAX_MSGS_AGENT;

            // Batch cleanup: instead of O(n) shift() on every message,
            // slice to first N when exceeding soft limit (amortized O(1))
            if ( this.msgs.length > 200 ) {
                // Keep only the last 100 messages
                this.msgs.splice(0, this.msgs.length - 100);
            }

        })

        ioClient.on( "metrics", ( metricsData ) => {
            // console.log( 'Connection.js on metrics', metricsData );
            this.metrics.value = metricsData;
        } );

        let previousSensingFrame;
        let previousSensingCount = 0;
        ioClient.on( "sensing", ( sensing ) => {
            if ( typeof sensing?.frame !== 'number' ) return;

            this.serverFrame.value = sensing.frame;
            const sensingCount = previousSensingCount + 1;
            if ( previousSensingFrame === undefined ) {
                this.sensingPerFrame.value = 1;
            } else if ( sensing.frame > previousSensingFrame ) {
                this.sensingPerFrame.value =
                    (sensingCount - previousSensingCount) / (sensing.frame - previousSensingFrame);
            }
            previousSensingFrame = sensing.frame;
            previousSensingCount = sensingCount;
        } );

        ioClient.on( "ping", ( latencyData, callback ) => {
            // Store latency data received from server (null on first ping)
            if (latencyData) {
                this.latency.value = latencyData;
            }
            // Acknowledge the ping (no data needed)
            callback();
        } );

        // Update current configs on config updates
        this.ioClient.onConfig( ( config ) => {
            // document.getElementById('config').textContent = JSON.stringify( config, undefined, 2 );
            // console.log( 'Connection.js onConfig', config );
            for ( let [key,value] of Object.entries(config) ) {
                this.configs[key] = value;
                // console.log( `Connection.js onConfig setting configs.${key} =`, value );
            }
        } )

        // Update the fixed-width, top-to-bottom map row on tile updates.
        this.ioClient.onTile( ( {x, y, type} ) => {
            // console.log( 'Connection.js onTile', { x, y, type } );
            const tiles = this.configs.GAME?.map?.tiles;
            const height = this.configs.GAME?.map?.height;
            if (!Array.isArray(tiles) || typeof height !== 'number' || typeof tiles[height - 1 - y] !== 'string') return;
            const rowIndex = height - 1 - y;
            const row = tiles[rowIndex];
            tiles[rowIndex] = row.slice(0, x * 2) + String(type).padEnd(2, ' ') + row.slice(x * 2 + 2);
        } );

        // console.log( 'Connection.js', this );

    }

}
