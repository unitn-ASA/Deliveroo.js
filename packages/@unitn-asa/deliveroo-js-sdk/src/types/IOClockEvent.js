
/**
 * @typedef { 'frame' | '1s' | '2s' | '5s' | '10s' | 'infinite' } IOClockEvent
 */



/**
 * @param { string } event
 * @returns { IOClockEvent }
 */
function parseClockEvent ( event ) {
    if ( event == 'frame' || event == '1s' || event == '2s' || event == '5s' || event == '10s' || event == 'infinite' )
        return event;
    else
        console.warn( `IOClockEvent: invalid event '${event}', defaulting to '1s'` );
        return '1s';
}

export { parseClockEvent };
