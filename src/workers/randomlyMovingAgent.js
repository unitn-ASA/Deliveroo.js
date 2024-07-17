const Agent = require('../deliveroo/Agent')
const Grid = require('../deliveroo/Grid');
const myClock =  require('../deliveroo/Clock');
const config =  require('../../config');



const RANDOM_AGENT_SPEED = process.env.RANDOM_AGENT_SPEED || config.RANDOM_AGENT_SPEED || '2s'; // move frequency



/**
 * @param {Grid} myGrid 
 */
module.exports = function ( myGrid, name ) {

    async function randomlyMove ( agent ) {
            
        const actions = {
            up: { x: 0, y: -1 },
            right: { x: 1, y: 0 },
            down: { x: 0, y: 1 },
            left: { x: -1, y: 0 }
        };
    
        const actionKeys = Object.keys(actions);
        let index = Math.floor(Math.random() * actionKeys.length);

        while ( true ) {
            
            const action = actions[actionKeys[index]];
            const moved = await agent.move(action.x, action.y); // try moving

            if (moved)
                await new Promise( res => myClock.once( RANDOM_AGENT_SPEED, res ) ); // wait before continue
            else
                await new Promise( res => setImmediate( res ) ); // if agent is stucked, this avoid blocking the whole program

            index += [0, 1, 3][Math.floor(Math.random() * 3)]; // straight or turn left or right, not going back
            index %= actionKeys.length; // normalize 0-3

        }
    }

    var myAgent = new Agent(myGrid, {name: name })
    myAgent = myGrid.createAgent( myAgent );
    randomlyMove (myAgent)

}

