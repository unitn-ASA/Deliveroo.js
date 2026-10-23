import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { once } from 'node:events';
import { test, before, after, afterEach } from 'node:test';
import { Server } from 'socket.io';
import { DjsConnect } from '../src/client/DjsConnect.js';

/** @typedef { import('../src/client/DjsClientSocket.js').DjsClientSocket } DjsClientSocket */

/** @type { Server } */
let io;
/** @type { string } */
let host;
/** @type { DjsClientSocket [] } */
const sockets = [];

/** DjsConnect logs on every lifecycle event: keep test output clean */
const originalConsole = { log: console.log, error: console.error };

before( async () => {
    console.log = () => {};
    console.error = () => {};
    const httpServer = createServer();
    io = new Server( httpServer );
    httpServer.listen( 0 );
    await once( httpServer, 'listening' );
    const { port } = /** @type { import('node:net').AddressInfo } */ ( httpServer.address() );
    host = `http://localhost:${ port }`;
} );

afterEach( () => {
    io.removeAllListeners( 'connection' );
    while ( sockets.length ) sockets.pop()?.disconnect();
} );

after( async () => {
    await io.close();
    Object.assign( console, originalConsole );
} );

/**
 * Connect through DjsConnect and track the socket for cleanup
 * @param { string } [token]
 * @param { string } [name]
 * @param { boolean } [autoconnect]
 */
function connect ( token, name, autoconnect ) {
    const socket = DjsConnect( host, token, name, autoconnect );
    sockets.push( socket );
    return socket;
}

test( 'sends the token as x-token header', async () => {
    const connection = once( io, 'connection' );
    connect( 'my-secret-token-12345', 'ignored-name' );
    const [ serverSocket ] = await connection;
    assert.equal( serverSocket.handshake.headers['x-token'], 'my-secret-token-12345' );
    assert.equal( serverSocket.handshake.query.name, undefined, 'token takes precedence over name' );
} );

test( 'sends the name as query parameter when no token is given', async () => {
    const connection = once( io, 'connection' );
    connect( '', 'alice' );
    const [ serverSocket ] = await connection;
    assert.equal( serverSocket.handshake.query.name, 'alice' );
    assert.equal( serverSocket.handshake.headers['x-token'], undefined );
} );

test( 'connects with neither token nor name', async () => {
    const connection = once( io, 'connection' );
    connect( '', '' );
    const [ serverSocket ] = await connection;
    assert.equal( serverSocket.handshake.headers['x-token'], undefined );
    assert.equal( serverSocket.handshake.query.name, undefined );
} );

test( 'does not connect until connect() when autoconnect is false', async () => {
    const socket = connect( '', 'bob', false );
    await new Promise( res => setTimeout( res, 50 ) );
    assert.equal( socket.connected, false );

    const connected = new Promise( res => socket.onConnect( () => res( undefined ) ) );
    socket.connect();
    await connected;
    assert.equal( socket.connected, true );
} );

test( 'returns an enhanced DjsClientSocket', () => {
    const socket = connect( '', 'carol', false );
    for ( const method of [ 'onConnect', 'onSensing', 'emitMove', 'emitPickup', 'emitPutdown', 'emitShout' ] )
        assert.equal( typeof /** @type { any } */ ( socket )[method], 'function', `missing ${method}` );
    assert.ok( socket.me instanceof Promise );
} );

test( 'acknowledges server ping events', async () => {
    io.on( 'connection', s => s.emit( 'ping', { serverTimestamp: Date.now() }, () => s.emit( 'pong-received' ) ) );
    const socket = connect( '', 'dave' );
    await new Promise( res => socket.once( /** @type { any } */ ( 'pong-received' ), res ) );
} );

test( 'me resolves with the first sensing that carries self', async () => {
    const self = { id: 'a1', name: 'erin', teamId: 't1', teamName: 'team', x: 0, y: 0, score: 0 };
    io.on( 'connection', s => {
        s.emit( 'sensing', { positions: [], agents: [], parcels: [], crates: [] } );
        s.emit( 'sensing', { positions: [], agents: [], parcels: [], crates: [], self } );
    } );
    const socket = connect( '', 'erin' );
    assert.deepEqual( await socket.me, self );
} );
