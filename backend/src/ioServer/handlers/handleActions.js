import { config } from '../../config/config.js';

const VALID_DIRECTIONS = ['up', 'down', 'left', 'right'];

/**
 * Dispatch path of the dedicated native events ('move', 'pickup', 'putdown'):
 * validates native payloads with the legacy semantics, then dispatches to the
 * agent-local command bus with a raw acknowledgement:
 * - 'move': { x, y } on success, false on failure or invalid direction
 * - 'pickup' / 'putdown': the array of affected parcels, [] when none
 * - unknown name or no handler: false ( [] for the array-shaped natives )
 *
 * Movement commands are explicit on the bus ('up', 'down', 'left', 'right'):
 * the dedicated 'move' event translates its direction payload to the
 * matching directional command.
 *
 * @param {import('../../core/Agent.js').default} agent - Agent entity
 * @param {string} name - Command name ('move', 'pickup', 'putdown')
 * @param {Object} params - Command payload
 * @param {Function} [acknowledgementCallback] - Acknowledgement callback
 */
function dispatchAction( agent, name, params, acknowledgementCallback ) {

    if ( typeof name !== 'string' || name.length === 0 ) {
        console.warn( `[handleActions] Invalid action name '${name}' from ${agent.name}(${agent.id})` );
        if ( acknowledgementCallback )
            acknowledgementCallback( false );
        return;
    }

    // Native payload validation: legacy semantics
    if ( name === 'move' ) {
        const { direction } = params;
        if ( typeof direction !== 'string' || ! VALID_DIRECTIONS.includes( direction ) ) {
            agent.penalty -= config.PENALTY;
            console.warn( `${agent.name}(${agent.id}) got penalty ${agent.penalty}: invalid move direction '${direction}'` );
            if ( acknowledgementCallback )
                acknowledgementCallback( false );
            return;
        }
        name = direction;
        params = {};
    }
    if ( name === 'putdown' && ! Array.isArray( params.selected ) ) {
        params.selected = [];
    }

    const dispatched = agent.commands.dispatch( name, { ...params, ack: acknowledgementCallback } );
    if ( ! dispatched ) {
        console.warn( `[handleActions] No '${name}' command handler for ${agent.name}(${agent.id})` );
        if ( acknowledgementCallback ) {
            if ( name === 'pickup' || name === 'putdown' )
                acknowledgementCallback( [] );
            else
                acknowledgementCallback( false );
        }
    }

}

/**
 * Dispatch path of the generic 'action' event: the joystick-like command
 * surface (up/down/left/right, pickup, putdown, plugin ones). Commands are
 * parameterless in practice: a params object is still accepted on the wire
 * for future plugin commands and forwarded to the handler, never used by
 * native commands.
 *
 * Every outcome is acknowledged exactly once, at command completion (the
 * action mutex is already released when the ack fires), wrapped in the
 * IOActionEnvelope:
 * - { success: true, result } with the handler outcome
 * - { success: false, error } on invalid name, unknown command, failed
 *   directional move, or handler error; plugin commands carry their own
 *   failures inside the result
 *
 * @param {import('../../core/Agent.js').default} agent - Agent entity
 * @param {any[]} args - Raw event arguments (name, params?, ack?)
 */
function dispatchEnvelopeAction( agent, args ) {

    const acknowledgementCallback = typeof args[ args.length - 1 ] === 'function' ? args.pop() : undefined;
    const [ name, rawParams ] = args;
    const params = ( rawParams && typeof rawParams === 'object' && ! Array.isArray( rawParams ) ) ? rawParams : {};

    if ( typeof name !== 'string' || name.length === 0 ) {
        acknowledgementCallback?.( { success: false, error: 'invalid command name' } );
        return;
    }

    const envelopeAck = ( result ) => {
        if ( VALID_DIRECTIONS.includes( name ) ) {
            if ( result === false ) {
                acknowledgementCallback?.( { success: false, error: `${name} blocked` } );
            } else {
                acknowledgementCallback?.( { success: true, result } );
            }
            return;
        }
        if ( name === 'pickup' || name === 'putdown' ) {
            acknowledgementCallback?.( { success: true, result: Array.isArray( result ) ? result : [] } );
            return;
        }
        acknowledgementCallback?.( { success: true, result } );
    };

    try {
        const dispatched = agent.commands.dispatch( name, { ...params, ack: envelopeAck } );
        if ( ! dispatched ) {
            acknowledgementCallback?.( { success: false, error: `unknown command '${name}'` } );
        }
    } catch ( error ) {
        console.error( `[handleActions] '${name}' handler error for ${agent.name}(${agent.id}):`, error.message );
        acknowledgementCallback?.( { success: false, error: error.message } );
    }

}

/**
 * Setup action handlers for an agent socket.
 * Actions are dispatched to the agent-local command bus. Attached components
 * register the handlers that implement each command. The dedicated native
 * events are kept for backward compatibility (existing agents, frontend
 * controller) and share the command bus with the generic 'action' event,
 * which is the parameterless command surface with envelope acknowledgements.
 *
 * @param {import('@unitn-asa/deliveroo-js-sdk/server').DjsServerSocket} socket - Enhanced socket
 * @param {import('../../core/Agent.js').default} agent - Agent entity
 */
export function handleActions(socket, agent) {

    socket.onMove( ( direction, acknowledgementCallback ) =>
        dispatchAction( agent, 'move', { direction }, acknowledgementCallback ) );

    socket.onPickup( ( acknowledgementCallback ) =>
        dispatchAction( agent, 'pickup', {}, acknowledgementCallback ) );

    socket.onPutdown( ( selected, acknowledgementCallback ) =>
        dispatchAction( agent, 'putdown', { selected }, acknowledgementCallback ) );

    // Generic event: complete command surface, native actions included
    socket.onAction( ( ...args ) =>
        dispatchEnvelopeAction( agent, args ) );

}
