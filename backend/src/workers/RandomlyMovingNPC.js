import myClock from '../myClock.js';
import timersPromises from 'timers/promises'; // await timersPromises.setImmediate();
import NPC from './NPC.js';
        
const actions = [ 'up', 'right', 'down', 'left' ];
const relPos = [ {x:0, y:1}, {x:1, y:0}, {x:0, y:-1}, {x:-1, y:0} ];


/** @typedef {import('@unitn-asa/deliveroo-js-sdk/types/IOGameOptions.js').IONpcsOptions} IONpcsOptions */



/**
 * Timeline of RandomlyMovingAgent
 * 
 * Events:                start()      stop()      stopped      start()
 * runningPromise          | pending                | res/rej   | pending
 * running                 | true                   | false     | true
 * stopRequested    false               | true      | false     
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
            count: 1,
            capacity: 5
        };

    }



    /**
     * @returns {Promise} Resolves when it stops
     */
    async execute ( ) {
    
        let index =  Math.floor( Math.random()*4 );

        while ( ! this.stopRequested ) {

            let tile = this.agent.grid.getTile( { x: this.agent.x + relPos[index].x, y: this.agent.y + relPos[index].y } );
            let moved = false;
            if ( tile && tile.walkable && ! tile.locked ) {
                moved = await this.agent[ actions[index] ](); // try moving
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
