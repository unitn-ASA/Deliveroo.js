import { commandBus } from '../commands/commandBus.js';
import { config } from '../../config/config.js';

const VALID_DIRECTIONS = ['up', 'down', 'left', 'right'];

/**
 * Setup action handlers for an agent socket.
 * Actions are dispatched to the command bus, where a plugin (e.g. a movement
 * plugin) may own the command. Pickup and putdown fall back to the direct
 * controller call when no plugin handles them.
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

        // Dispatch to the registered movement handler (e.g. MovementPlugin)
        const dispatched = commandBus.dispatch( 'move', { agent, direction, ack: acknowledgementCallback } );
        if ( ! dispatched ) {
            // No movement handler registered: acknowledge so the client does not hang
            console.warn( '[handleActions] No handler for move command (is a movement plugin running?)' );
            if ( acknowledgementCallback )
                acknowledgementCallback( false );
        }
    } );

    socket.onPickup( async ( acknowledgementCallback ) => {
        // Dispatch to a registered handler if any; otherwise default to direct controller call
        if ( commandBus.dispatch( 'pickup', { agent, ack: acknowledgementCallback } ) ) {
            return;
        }
        const pickedUpParcels = await agent.controller.pickUp();
        if ( acknowledgementCallback )
            acknowledgementCallback( pickedUpParcels );
    } );

    socket.onPutdown( async ( selected, acknowledgementCallback ) => {
        // Validate selected is array
        if ( ! Array.isArray( selected ) ) {
            selected = [];
        }

        if ( commandBus.dispatch( 'putdown', { agent, selected, ack: acknowledgementCallback } ) ) {
            return;
        }
        const putDownResult = await agent.controller.putDown( selected );
        if ( acknowledgementCallback )
            acknowledgementCallback( putDownResult.map( p => ( { id: p.id } ) ) );
    } );

}
