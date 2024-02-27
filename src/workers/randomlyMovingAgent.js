const Grid = require('../deliveroo/Grid');
const myClock =  require('../deliveroo/Clock');
const Config = require('../deliveroo/Config');


/**
 * @param {Config} config
 * @param {Grid} myGrid 
 */
module.exports = function ( config, myGrid, name ) {

    async function randomlyMove ( agent ) {
            
        const actions = [ 'up', 'right', 'down', 'left' ];
        let index =  Math.floor( Math.random()*4 );

        while ( true ) {
            
            const moved = await agent[ actions[index] ](); // try moving
            if (moved)
                await new Promise( res => myClock.once( config.RANDOM_AGENT_SPEED, res ) ); // wait before continue
            else
                await new Promise( res => setImmediate( res ) ); // if agent is stucked, this avoid blocking the whole program

            index += [0,1,3][ Math.floor(Math.random()*3) ]; // straigth or turn left or right, not going back
            index %= 4; // normalize 0-3

        }
    }

    var myAgent = myGrid.createAgent( {name} );
    randomlyMove (myAgent)

}

