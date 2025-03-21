var Agent =  require('../src/deliveroo/Agent');
const myClock = require('../src/deliveroo/Clock');

/**
 * @class GhostAgent
 * @extends Agent
*/
class GhostAgent extends Agent {

    constructor ( grid, options ) {
        super ( grid, options );
        console.log("I am a ghost", options);
    }
    
    moving = false;
    async move ( incr_x, incr_y ) {
        if ( this.moving ) // incr_x%1!=0 || incr_y%1!=0 ) // if still moving
            return false;
        this.moving = true;
        await myClock.synch();
        let toTile = this.grid.getTile( {x: this.x + incr_x, y: this.y + incr_y } );
        if ( toTile ) {
            // console.log(this.id, 'start move in', this.x+incr_x, this.y+incr_y)
            this.moving = true;
            await this.stepByStep( incr_x, incr_y );
            // console.log(this.id, 'done move in', this.x, this.y)
            this.moving = false;
            return this.xy;
        }
        // console.log(this.id, 'fail move in', this.x+incr_x, this.y+incr_y)
        this.moving = false;
        return false;
    }
    
}

global.Agent = GhostAgent;
// const oldLogger = console.log;
// global.console.log = (...data) => oldLogger('MY LOGGER', ...data)

module.exports = GhostAgent;