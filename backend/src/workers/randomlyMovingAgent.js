const Grid = require('../deliveroo/Grid');
const myClock =  require('../deliveroo/Clock');
const {RANDOM_AGENT_SPEED} =  require('../../config');
const Identity = require('../deliveroo/Identity');
const timersPromises = require('timers/promises'); // await timersPromises.setImmediate();
const Agent = require('../deliveroo/Agent');
        
const actions = [ 'up', 'right', 'down', 'left' ];
const relPos = [ {x:0, y:1}, {x:1, y:0}, {x:0, y:-1}, {x:-1, y:0} ];

/**
 * @param {Grid} myGrid
 */
module.exports = function ( myGrid ) {

    /**
     * @param {Agent} agent 
     */
    async function randomlyMove ( agent ) {
    
        let index =  Math.floor( Math.random()*4 );

        while ( true ) {

            let tile = agent.grid.getTile( { x: agent.x + relPos[index].x, y: agent.y + relPos[index].y } );
            let moved = false;
            if ( tile?.walkable && ! tile?.locked ) {
                moved = await agent[ actions[index] ](); // try moving
            }
            if (moved)
                // wait before continue
                await new Promise( res => myClock.once( RANDOM_AGENT_SPEED, res ) );
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

    const myAgent = myGrid.createAgent( new Identity() );
    
    randomlyMove( myAgent );

}

