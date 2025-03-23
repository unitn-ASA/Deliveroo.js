/**
 * @typedef { 'frame' | '1s' | '2s' | '5s' | '10s' } ClockEvent
 */

/**
 * @param { string } event
 * @returns { ClockEvent }
 */
function parseClockEvent ( event ) {
    if ( event == 'frame' || event == '1s' || event == '2s' || event == '5s' || event == '10s' )
        return event;
    else
        throw new Error( `ClockEvents: invalid event '${event}'` );
}

module.exports = { parseClockEvent };