import myClock from '../myClock.js';
import timersPromises from 'timers/promises'; // await timersPromises.setImmediate();
import NPC from './NPC.js';

/** @type {('up'|'right'|'down'|'left')[]} */
const actions = [ 'up', 'right', 'down', 'left' ];


/** @typedef {import('@unitn-asa/deliveroo-js-sdk/types/IOGameOptions.js').IONpcsOptions} IONpcsOptions */



/**
 * Timeline of RandomlyMovingAgent
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
 * @extends { NPC }
 */
class RandomlyMovingAgent extends NPC {



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
            const plausible = this.agent.commands.ask('move', 'plausible', { direction: actions[index] }, true);
            if ( plausible ) {
                moved = await this.agent.commands.execute( 'move', { direction: actions[index] }, false );
            }

            if (moved)
                // wait before continue
                await new Promise( res => myClock.once( this.options.moving_event, res ) );
            else
                // if agent is stucked, this avoid blocking the whole program
                await timersPromises.setImmediate();
                // await new Promise( res => process.nextTick( res ) ); // this may get stucked in infinite loop
                // await myClock.once( 'frame' );

            // straigth or turn left or right, not going back
            index += [0,1,3][ Math.floor(Math.random()*3) ];
            // normalize 0-3
            index %= 4;

        }

    }

}


export default RandomlyMovingAgent;
