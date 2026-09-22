import myClock from '../myClock.js';

/** @typedef {import('@unitn-asa/deliveroo-js-sdk/types/IOGameOptions.js').IONpcsOptions} IONpcsOptions */

/**
 * Wait for the configured NPC moving event. The 'infinite' sentinel is not
 * a clock event: it parks the NPC forever (it never moves again).
 * @param {IONpcsOptions['moving_event']} movingEvent
 * @returns {Promise<void>}
 */
function waitForMovingEvent(movingEvent) {
    if (movingEvent === 'infinite') {
        return new Promise(() => {});
    }
    return new Promise((res) => myClock.once(movingEvent, res));
}

export { waitForMovingEvent };
export default waitForMovingEvent;
