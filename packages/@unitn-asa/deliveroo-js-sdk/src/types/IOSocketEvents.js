
/** @typedef {import('./IOAgent.js').IOAgent} IOAgent */
/** @typedef {import('./IOTile.js').IOTile} IOTile */
/** @typedef {import('./IOSensing.js').IOSensing} IOSensing */
/** @typedef {import('./IOMetrics.js').IOMetrics} IOMetrics */



/**
 * Client -> Server events. Emitted by the client and listened by the server.
 * @typedef {{
 *      'disconnect':   (                                                                   ) => void,
 *      'move':         ( direction: 'up' | 'right' | 'left' | 'down',
 *                        ack ? : function ( { x:number, y:number } | false ) : void        ) => void,
 *      'pickup':       ( ack ? : function ( { id:string } [] ) : void                      ) => void,
 *      'putdown':      ( parcelsIds ? : string [],
 *                        ack ? : function ( { id:string } [] ) : void                      ) => void,
 *      'say':          ( toId: string,
 *                        msg: any,
 *                        ack ? : function( 'successful' | 'failed' ) : void                ) => 'successful' | 'failed',
 *      'ask':          ( toId: string,
 *                        msg: any,
 *                        ack ? : function( any ) : void                                    ) => any,
 *      'shout':        ( msg: any,
 *                        ack ? : function( any ) : void                                    ) => void,
 *      'log':          ( ...msg: any                                                       ) => void,
 * } & {
 *      'parcel':       ( what: 'create' | 'dispose' | 'set',
 *                        where: { x:number, y:number } | { id:string, reward?:number }     ) => void,
 *      'crate':        ( what: 'create' | 'dispose',
 *                        where: { x:number, y:number }                                     ) => void,
 *      'restart':      (                                                                   ) => void,
 *      'tile':         ( tile: IOTile                                                      ) => void,
 *      'reward':       ( agent: { agentId: string, points: number }                        ) => void,
 *     'agent:teleport':( agentId: string, position: { x:number, y:number }                 ) => void
 *      'agent:control':( agentId: string, action: string, params: any,
 *                        ack ? : function( any ) : void                                    ) => void
 * }} IOClientEvents
 */

/**
 * Server -> Client events. Emitted by the server and listened by the client.
 * @typedef {{
 *      'connect':          () => void,
 *      'disconnect':       () => void,
 *      'token':            ( token: string ) => void,
 *      'config':           ( config: any ) => void,
 *      'map':              ( width: number, height: number, tiles: IOTile[] ) => void,
 *      'tile':             ( tile: IOTile ) => void,
 *      'you':              ( agent: IOAgent ) => void,
 *      'sensing':          ( sensing: IOSensing ) => void,
 *      'msg':              ( fromId: string, fromName: string, content: Object,
 *                            ack?: ( response: Object ) => void
 *                          ) => Object,
 *      'log':              ( source: 'server' | { socket:string, id:string, name:string },
 *                            ...msg: any
 *                          ) => void
 *      'ping':             ( pingData: { frame: number, roundTrip: number },
 *                            ack: () => void
 *                          ) => void
 * } & {
 *      'controller':       ( status: 'connected' | 'disconnected',
 *                            agentInfo: {id:string, name:string, teamId:string, teamName:string, score:number}
 *                          ) => void,
 *      'metrics':          ( metrics: IOMetrics ) => void
 * }} IOServerEvents
 */

export { };