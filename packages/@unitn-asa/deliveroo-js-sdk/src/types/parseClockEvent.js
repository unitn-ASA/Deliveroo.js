
/** @import { IOClockEvent } from "./IOClockEvent.js" */



/**
 * @param { string } event
 * @returns { IOClockEvent }
 */
function parseClockEvent ( event ) {
    if ( event == 'frame' || event == '1s' || event == '2s' || event == '5s' || event == '10s' )
        return event;
    else
        throw new Error( `IOClockEvent: invalid event '${event}'` );
}

export { parseClockEvent };
