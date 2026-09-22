
/** @import { IOClockEventSetting } from "./IOClockEvent.js" */



/**
 * Strict variant of the *_event field normalization: throws instead of
 * defaulting on an invalid value.
 * @param { string } event
 * @returns { IOClockEventSetting }
 */
function parseClockEvent ( event ) {
    if ( event == 'frame' || event == '1s' || event == '2s' || event == '5s' || event == '10s' || event == '1m' || event == '1h' || event == 'infinite' ) {
        return event;
    }
    else {
        throw new Error( `IOClockEvent: invalid event '${event}'` );
    }
}

export { parseClockEvent };
