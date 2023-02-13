const Observable =  require('../utils/Observable')
const Tile =  require('./Tile')
const Agent =  require('./Agent')
const Parcel = require('./Parcel');
const Xy = require('./Xy');
const { MinEquation } = require('three');



/**
 * @class Grid
 */
class Grid extends Observable {
    /** @attribute {Array<Tile>} */
    #tiles;
    /** @attribute {Map<string, Agent>} */
    #agents;
    /** @attribute {Map<string, Parcel>} */
    // #parcels;
    
    /**
     * @constructor Grid
     */
    constructor ( map = new Array(10).map( c=>new Array(10) ) ) {
        super();
        
        var Xlength = map.length;
        var Ylength = map.length;
        this.#tiles = Array.from(map).map( (column, x) => {
            return Array.from(column).map( (blocked, y) => new Tile(this, x, y, blocked, ( x==0 || x==Xlength-1 || y==0 || y==Ylength-1 ? true : false )) )
        } );
        // console.log( this.#tiles.map( c=>c.map( t=>t.x+' '+t.y+' ' ) ) )
        
        // this.#tiles = [];
        // for (let x = 0; x < 10; x++) {
        //     let column = [];
        //     for (var y = 0; y < 10; y++) {
        //         column.push(new Tile(this, x, y))
        //     }
        //     this.#tiles.push(column);
        // }

        this.#agents = new Map();
        // this.#parcels = new Map();
        
        // // Dispatch all my events
        // this.observe( Game.dispatcher.triggerEvents.bind(Game.dispatcher) );
    }

    *getTiles ( [x1,x2,y1,y2]=[0,10000,0,10000] ) {
        const xLength = ( this.#tiles.length ? this.#tiles.length : 0 );
        const yLength = ( this.#tiles.length && this.#tiles[0].length ? this.#tiles[0].length : 0 );
        x1 = Math.max(0,x1)
        x2 = Math.min(xLength,x2);
        y1 = Math.max(0,y1)
        y2 = Math.min(yLength,y2);
        // console.log(xLength, yLength, x1, x2, y1, y2)
        for ( let x = x1; x < x2; x++ )
            for ( let y = y1; y < y2; y++ ) {
                var tile = this.#tiles.at(x).at(y);
                if ( tile ) yield tile;
            }
        // return Array.from(this.#tiles).flat();
    }

    /**
     * @type {function(number,number): Tile}
     */
    getTile ( x, y ) {
        if ( x < 0 || y < 0)
            return null;
        // x = Math.round(x)
        // y = Math.round(y)
        let column = this.#tiles.at(x)
        return column ? column.at(y) : null;
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

            // Register
            this.#agents.set(id, agent);

            // Propagate agent events
            agent.on('xy', this.emit.bind(this, 'agent xy') );
            agent.on('score', this.emit.bind(this, 'agent score') );
            agent.on('agent', this.emit.bind(this, 'agent') );

            // On mine and others movement evaluateSensing
            this.on( 'agent xy', (sensedAgent) => { /*if ( !sensedAgent.moving )*/ agent.evaluateSensing(sensedAgent) } )
            // On others score evaluateSensing
            this.on( 'agent score', (it) => { if ( it.id != agent.id ) agent.evaluateSensing(it) } )
            // On parcel added
            this.on( 'parcel added', (id, x, y, reward) => agent.evaluateSensing(agent) );
            // On parcel removed
            this.on( 'parcel removed', (id, x, y, reward) => agent.evaluateSensing(agent) );
        }
        return this.#agents.get(id);
    }

    deleteAgent ( agent ) {
        if ( agent.tile )
            agent.tile.unlock();
        agent.x = undefined;
        agent.y = undefined;
        this.#agents.delete(id);
    }

    /**
     * @type {function(Number, Number): Parcel}
     */
    createParcel ( x, y ) {
        var tile = this.getTile( x, y );
        if ( !tile || tile.blocked )
            return false;
        // Instantiate
        var parcel = new Parcel( this ); // Propagate // parcel.on('reward', this.emit.bind(this, 'parcel reward') );
        parcel.on('reward', this.emit.bind(this, 'parcel reward') );
        parcel.on('expired', this.emit.bind(this, 'parcel expired') );
        // Register on grid
        // this.#parcels.set( parcel.id, parcel );
        // Place
        tile.addParcel( parcel );
        
        return parcel;
    }

    // /**
    //  * @type {function(): IterableIterator<Parcel>}
    //  */
    // getParcels () {
    //     return this.#parcels.values();
    // }

}


module.exports = Grid;