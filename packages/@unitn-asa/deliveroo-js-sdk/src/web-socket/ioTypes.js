/**
 * @typedef IOAgent
 * @property {string} id
 * @property {string} name
 * @property {string} teamId
 * @property {string} teamName
 * @property {number} x
 * @property {number} y
 * @property {number} score
 * @property {number} penalty
 */

/**
 * @typedef IOParcel
 * @property {string} id
 * @property {number} x
 * @property {number} y
 * @property {string=} carriedBy
 * @property {number} reward
 */

/**
 * @typedef IOTile
 * @property {number} x
 * @property {number} y
 * @property {string} type
 */

/**
 * @typedef IOInfo
 * @property {number} ms
 * @property {number} frame
 * @property {number} fps
 * @property {number} heapUsed
 * @property {number} heapTotal
 */

/**
 * @typedef {{
 *      'disconnect':   function () : void,
 *      'move':         function ( 'up' | 'right' | 'left' | 'down' | { x:number, y:number }, function ( { x:number, y:number } | false ) : void = ) : { x:number, y:number } | false,
 *      'pickup':       function ( function ( { id:string } [] ) : void = ) : { id:string } [],
 *      'putdown':      function ( string [] =, function ( { id:string } [] ) : void = ) : { id:string } [],
 *      'say':          function ( string, any, function( 'successful' ) : void ) : void,
 *      'ask':          function ( string, any, function( any ) : void ) : void,
 *      'shout':        function ( any, function( any ) : void ) : void,
 *      'parcel':       function ( 'create' | 'dispose' | 'set', { x:number, y:number } | { id:string, reward?:number } ) : void,
 *      'restart':      function () : void,
 *      'tile':         function ( IOTile ) : void,
 *      'log':          function ( ...any ) : void
 * }} IOClientEvents
 */

/**
 * @typedef {{
 *      'connect':          function () : void,
 *      'disconnect':       function () : void,
 *      'token':            function ( string ) : void,
 *      'config':           function ( any ) : void,
 *      'map':              function ( number, number, IOTile[] ) : void,
 *      'tile':             function ( IOTile, IOInfo ) : void,
 *      'controller':       function ( 'connected' | 'disconnected', {id:string, name:string, teamId:string, teamName:string, score:number} ) : void,
 *      'you':              function ( IOAgent, IOInfo ) : void,
 *      'agents sensing':   function ( IOAgent[], IOInfo ) : void,
 *      'parcels sensing':  function ( IOParcel[], IOInfo ) : void,
 *      'msg':              function ( string, string, Object, function ( Object ) : void = ) : Object,
 *      'log':              function ( {src: 'server'|'client', ms:number, frame:number, socket:string, id:string, name:string}, ...any ) : void
 * }} IOServerEvents
 */

module.exports = { };