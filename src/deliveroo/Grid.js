const Observable =  require('../utils/Observable')
const Tile =  require('./Tile')
const Agent =  require('./Agent')
const Parcel = require('./Parcel');
const Xy = require('./Xy');



/**
 * @class Grid
 */
class Grid extends Observable {
    /** @attribute {Array<Tile>} */
    #tiles;
    /** @attribute {Map<string, Agent>} */
    #agents;
    /** @attribute {Map<string, Parcel>} */
    #parcels;
    
    /**
     * @constructor Grid
     */
    constructor ( blocked = [] ) {
        super();
        this.#tiles = [];
        for (let x = 0; x < 10; x++) {
            let column = [];
            for (var y = 0; y < 10; y++) {
                column.push(new Tile(this, x, y))
            }
            this.#tiles.push(column);
        }
        for (const n of blocked) {
            this.getTile(n.x, x.y).blocked = true;
        }
        this.#agents = new Map();
        this.#parcels = new Map();
        
        // // Dispatch all my events
        // this.observe( Game.dispatcher.triggerEvents.bind(Game.dispatcher) );
    }

    /**
     * @type {function(Xy): Tile}
     */
    getTile ( {x, y} = xy ) {
        return this.#tiles[Math.round(x)] ? this.#tiles[Math.round(x)][Math.round(y)] : null;
    }

    /**
     * @type {function(): string[]}
     */
    getAgentIds () {
        return this.#agents.keys();
    }

    /**
     * @type {function(string): Agent}
     */
    getAgent ( id ) {
        if ( !this.#agents.has(id) ) {
            // Instantiate
            var agent = new Agent(id, this)
            // Propagate agent position events
            agent.observe(
                this.triggerEvents.bind(this),
                ev => ev.object == 'xy' && ev.subject instanceof Agent // && ev.subject.xy.x % 1 == 0 && ev.subject.xy.y % 1 == 0
            );
            // Register
            this.#agents.set(id, agent);
        }
        return this.#agents.get(id);
    }

    deleteAgent ( id ) {
        if ( this.#agents.has(id) ) {
            var agent = this.#agents.get(id);
            agent.tile.unlock();
            this.#agents.delete(id);
        }
    }

    /**
     * @type {function(Xy): Parcel}
     */
    createParcel ( position ) {
        // Instantiate
        var parcel = new Parcel( this );
        // Propagate all parcel events
        parcel.observe( this.triggerEvents.bind(this) );
        // Register
        this.#parcels.set( parcel );
        // Register in Tile
        var tile = this.getTile( position );
        tile.parcels.add( parcel );
        this.triggerEvent( new Observable.Event('add parcel', parcel, tile) );
        return parcel;
    }

}


module.exports = Grid;