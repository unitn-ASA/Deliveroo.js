import timersPromises from 'timers/promises'; // await timersPromises.setImmediate();
import Autopilot from './Autopilot.js';
import { config } from '../config/config.js';
import waitForMovingEvent from './waitForMovingEvent.js';

/** @type {('up'|'right'|'down'|'left')[]} */
const actions = [ 'up', 'right', 'down', 'left' ];


/** @typedef {import('@unitn-asa/deliveroo-js-sdk/types/IOGameOptions.js').IONpcsOptions} IONpcsOptions */



/**
 * Timeline of RandomWalk
 *
 * Events:                start()      stop()      stopped      start()
 * runningPromise          | pending                | res/rej   | pending
 * running                 | true                   | false     | true
 * stopRequested    false               | true      | false
 *
 * Moves through the agent-local command bus. Component-specific plausibility
 * prechecks keep wandering penalty-free when available.
 *
 * @class
 * @extends { Autopilot }
 */
class RandomWalk extends Autopilot {



    /**
     * @param {IONpcsOptions} options
     */
    constructor ( options ) {

        super();

        /** @type {IONpcsOptions} */
        this.options = options || {
            type: 'random',
            moving_event: 'frame',
            count: 1
        };

    }



    /**
     * @returns {Promise} Resolves when it stops
     */
    async execute ( ) {

        let index =  Math.floor( Math.random()*4 );

        while ( ! this.stopRequested ) {

            let moved = false;
            // Never move without a positive feasibility check: when no
            // movement provider is attached (or mid-switch) the slot is empty
            // and the plausible fallback must not silently allow the attempt
            const plausible = this.agent.commands.ask(actions[index], 'plausible', {}, false);
            if ( plausible ) {
                moved = await this.agent.commands.execute( actions[index], {}, false );
            }

            if (moved)
                // wait before continue
                await waitForMovingEvent(this.options.moving_event);
            else
                // if agent is stucked, wait one move duration before trying
                // another direction, otherwise it spins in a tight retry loop
                await timersPromises.setTimeout( config.GAME.player.movement_duration );

            // straigth or turn left or right, not going back
            index += [0,1,3][ Math.floor(Math.random()*3) ];
            // normalize 0-3
            index %= 4;

        }

    }

}


export default RandomWalk;
