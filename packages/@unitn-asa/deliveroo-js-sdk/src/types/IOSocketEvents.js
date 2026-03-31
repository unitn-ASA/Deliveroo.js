
/** @typedef {import('./IOAgent.js').IOAgent} IOAgent */
/** @typedef {import('./IOTile.js').IOTile} IOTile */
/** @typedef {import('./IOInfo.js').IOInfo} IOInfo */
/** @typedef {import('./IOSensing.js').IOSensing} IOSensing */

/**
 * Client -> Server events. Emitted by the client and listened by the server.
 * @typedef {{
 *      'disconnect':   function () : void,
 *      'move':         function ( 'up' | 'right' | 'left' | 'down', function ( { x:number, y:number } | false ) : void = ) : { x:number, y:number } | false,
 *      'pickup':       function ( function ( { id:string } [] ) : void = ) : { id:string } [],
 *      'putdown':      function ( string [] =, function ( { id:string } [] ) : void = ) : { id:string } [],
 *      'say':          function ( string, any, function( 'successful' ) : void ) : void,
 *      'ask':          function ( string, any, function( any ) : void ) : void,
 *      'shout':        function ( any, function( any ) : void ) : void,
 *      'parcel':       function ( 'create' | 'dispose' | 'set', { x:number, y:number } | { id:string, reward?:number } ) : void,
 *      'crate':        function ( 'create' | 'dispose', { x:number, y:number } ) : void,
 *      'restart':      function () : void,
 *      'tile':         function ( IOTile ) : void,
 *      'log':          function ( ...any ) : void
 * }} IOClientEvents
 */

/**
 * Server -> Client events. Emitted by the server and listened by the client.
 * @typedef {{
 *      'connect':          function () : void,
 *      'disconnect':       function () : void,
 *      'token':            function ( string ) : void,
 *      'config':           function ( any ) : void,
 *      'map':              function ( number, number, IOTile[] ) : void,
 *      'tile':             function ( IOTile ) : void,
 *      'controller':       function ( 'connected' | 'disconnected', {id:string, name:string, teamId:string, teamName:string, score:number} ) : void,
 *      'you':              function ( IOAgent ) : void,
 *      'sensing':          function ( IOSensing ) : void,
 *      'info':             function ( IOInfo ) : void,
 *      'msg':              function ( string, string, Object, function ( Object ) : void = ) : Object,
 *      'log':              function ( 'server' | { socket:string, id:string, name:string }, ...any ) : void
 * }} IOServerEvents
 */

export { };