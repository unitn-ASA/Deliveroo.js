const myClock =  require('../myClock');
const config =  require('../../config');
const timersPromises = require('timers/promises'); // await timersPromises.setImmediate();
const NPC = require('./NPC'); 
        
const actions = [ 'up', 'right', 'down', 'left' ];
const relPos = [ {x:0, y:1}, {x:1, y:0}, {x:0, y:-1}, {x:-1, y:0} ];



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
     * @returns {Promise} Resolves when it stops
     */
    async moveUntilStopRequested ( ) {
    
        let index =  Math.floor( Math.random()*4 );

        while ( ! this.stopRequested ) {

            let tile = this.agent.grid.getTile( { x: this.agent.x + relPos[index].x, y: this.agent.y + relPos[index].y } );
            let moved = false;
            if ( tile && tile.walkable && ! tile.locked ) {
                moved = await this.agent[ actions[index] ](); // try moving
            }
            if (moved)
                // wait before continue
                await new Promise( res => myClock.once( config.RANDOM_AGENT_SPEED, res ) );
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


module.exports = RandomlyMovingAgent;
