import { config } from '../../config/config.js';

const VALID_DIRECTIONS = ['up', 'down', 'left', 'right'];

/**
 * Setup action handlers for an agent socket.
 * Actions are dispatched to the command bus, where the command dispatcher owns
 * built-in commands and plugins may replace individual handlers.
 *
 * @param {import('@unitn-asa/deliveroo-js-sdk/server').DjsServerSocket} socket - Enhanced socket
 * @param {import('../../deliveroo/Agent.js').default} agent - Agent entity
 */
export function handleActions(socket, agent) {

    socket.onMove( (direction, acknowledgementCallback) => {

        // Validate direction, penalizing invalid input
        if ( typeof direction !== 'string' || ! VALID_DIRECTIONS.includes( direction ) ) {
            agent.penalty -= config.PENALTY;
            console.warn( `${agent.name}(${agent.id}) got penalty ${agent.penalty}: invalid move direction '${direction}'` );
            if ( acknowledgementCallback )
                acknowledgementCallback( false );
            return;
        }

        const dispatched = agent.commands.dispatch( 'move', { direction, ack: acknowledgementCallback } );
        if ( ! dispatched ) {
            console.warn( `[handleActions] No move command handler for ${agent.name}(${agent.id})` );
            if ( acknowledgementCallback )
                acknowledgementCallback( false );
        }
    } );

    socket.onPickup( async ( acknowledgementCallback ) => {
        const dispatched = agent.commands.dispatch( 'pickup', { ack: acknowledgementCallback } );
        if ( ! dispatched ) {
            console.warn( `[handleActions] No pickup command handler for ${agent.name}(${agent.id})` );
            if ( acknowledgementCallback )
                acknowledgementCallback( [] );
        }
    } );

    socket.onPutdown( async ( selected, acknowledgementCallback ) => {
        // Validate selected is array
        if ( ! Array.isArray( selected ) ) {
            selected = [];
        }

        const dispatched = agent.commands.dispatch( 'putdown', { selected, ack: acknowledgementCallback } );
        if ( ! dispatched ) {
            console.warn( `[handleActions] No putdown command handler for ${agent.name}(${agent.id})` );
            if ( acknowledgementCallback )
                acknowledgementCallback( [] );
        }
    } );

}
