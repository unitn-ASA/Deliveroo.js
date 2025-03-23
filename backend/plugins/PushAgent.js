const Agent = require('../src/deliveroo/Agent');
const Grid = require('../src/deliveroo/Grid');
const Identity = require('../src/deliveroo/Identity');

/**
 * @class
 * @extends Agent
*/
class PushAgent extends Agent {

    /** @type {Grid} */
    #grid;

    /**
     * @param {Grid} grid
     * @param {Identity} identity
     */
    constructor ( grid, identity ) {
        super ( grid, identity );
        this.#grid = grid;
        console.log("I am a PushAgent", identity.name, `(${identity.id})`);
    }
    
    async move ( incr_x, incr_y ) {
        let fromTile = this.tile;
        if (!fromTile)
            return false;
        let toTile = this.#grid.getTile( { x: this.x + incr_x, y: this.y + incr_y } );
        if ( toTile && toTile.walkable ) {
            if ( toTile.locked ) {
                await [...this.#grid.agents.values()].find( agent => agent.tile === toTile )?.move( incr_x, incr_y );
            }
            if ( ! toTile.locked ) {
                toTile.lock();
                // console.log(this.id, 'start move in', this.x+incr_x, this.y+incr_y)
                await this.stepByStep( incr_x, incr_y );
                // console.log(this.id, 'done move in', this.x, this.y)
                fromTile.unlock();
                // this.emitParcelSensing(); // NO! this is done outside
                return this.xy;
            }
        }
        // console.log(this.id, 'fail move in', this.x+incr_x, this.y+incr_y)
        this.penalty -= this.config.PENALTY;
        return false;
    }
    
}



module.exports = PushAgent;

// Lazy plugin installation
global.PushAgent = PushAgent;
require('../config').AGENT_TYPE = 'PushAgent';
