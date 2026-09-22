
/**
 * Clock events the game Clock actually emits (backend/src/core/Clock.js).
 * @typedef { 'frame' | '1s' | '2s' | '5s' | '10s' | '1m' | '1h' } IOClockEvent
 */

/**
 * Value accepted by the game configuration *_event fields: a clock event,
 * or the 'infinite' sentinel meaning "never" (the Clock never emits it, so
 * a listener registered on it simply never fires).
 * @typedef { IOClockEvent | 'infinite' } IOClockEventSetting
 */



/**
 * Normalize the value of a game configuration *_event field.
 * @param { string } event
 * @returns { IOClockEventSetting }
 */
function parseClockEvent ( event ) {
    if ( event == 'frame' || event == '1s' || event == '2s' || event == '5s' || event == '10s' || event == '1m' || event == '1h' || event == 'infinite' ) {
        return event;
    }
    else {
        console.warn( `IOClockEvent: invalid event '${event}', defaulting to '1s'` );
        return '1s';
    }
}

export { parseClockEvent };
