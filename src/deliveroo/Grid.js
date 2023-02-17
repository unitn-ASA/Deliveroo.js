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
            var me = new Agent(id, this)

            // Register
            this.#agents.set(id, me);

            // // Tile scoped event propagation
            // me.on( 'xy', (...args) => me.tile.emit('agent xy', ...args) );
            // me.on( 'score', (...args) => me.tile.emit('agent score', ...args) );
            // me.on( 'pickup', (...args) => me.tile.emit('agent pickup', ...args) );
            // me.on( 'putdown', (...args) => me.tile.emit('agent putdown', ...args) );

            // // On mine and others movement evaluateSensing
            // const mySensor = new Observable();
            // me.on( 'agent xy', (me) => {
            //     if ( !me.moving ) {
            //         const sensedTiles = this.getTiles( [me.x-5, me.x+5, me.y-5, me.y+5] )
            //         for ( const tile of sensedTiles ) {
            //             tile.on( 'agent xy', mySensor.emit.bind(mysensor, 'agent xy') );
            //             tile.on( 'agent score', mySensor.emit.bind(mysensor, 'agent score') );
            //             tile.on( 'agent pickup', mySensor.emit.bind(mysensor, 'agent pickup') );
            //             tile.on( 'agent putdown', mySensor.emit.bind(mysensor, 'agent putdown') );
            //         }
            //     }
            // } )

            // Grid scoped events propagation
            me.on( 'xy', this.emit.bind(this, 'agent xy') );
            me.on( 'score', this.emit.bind(this, 'agent score') );
            me.on( 'pickup', this.emit.bind(this, 'agent pickup') );
            me.on( 'putdown', this.emit.bind(this, 'agent putdown') );
            // me.on( 'agent', this.emit.bind(this, 'agent') );
            

            // On mine and others movement evaluateSensing
            this.on( 'agent xy', (sensedAgent) => {
                /*if ( !sensedAgent.moving )*/
                    me.evaluateSensing(sensedAgent)
            } )
            // On others score evaluateSensing
            this.on( 'agent score', (it) => {
                if ( it.id != me.id && it.distance(me) < 5 )
                    me.emit( 'sensing agent', it.id, it.x, it.y, it.score, it.carrying )
            } )
            // On others pickup
            this.on( 'agent pickup', (it, picked) => {
                if ( it.id != me.id && it.distance(me) < 5 )
                    me.emit( 'sensing agent', it.id, it.x, it.y, it.score, it.carrying )
            } )
            // On others putdown
            this.on( 'agent putdown', (it, dropped) => {
                if ( it.id != me.id && it.distance(me) < 5 )
                    me.emit( 'sensing agent', it.id, it.x, it.y, it.score, it.carrying )
            } )

            // On parcel
            // this.on( 'parcel carriedBy', (parcel) => { if ( parcel.carriedBy.distance(me) < 5 ) me.evaluateSensing(parcel.carriedBy) } )
            this.on( 'parcel reward', (parcel) => {
                var parcels = [];
                for ( var tile of this.getTiles() ) {// [me.x-5, me.x+5, me.y-5, me.y+5] ) ) {
                    let {x, y} = tile;
                    if ( tile.distance(me) < 5 ) {
                        for ( let parcel of tile.parcels ) {
                            let {id, reward} = parcel;
                            parcels.push( {id, x, y, reward} )
                        }
                    }
                }
                me.emitOnePerTick( 'parcel sensing', parcels )
            } );
        }
        return this.#agents.get(id);
    }

    deleteAgent ( agent ) {
        if ( agent.tile )
            agent.tile.unlock();
        agent.x = undefined;
        agent.y = undefined;
        this.#agents.delete(agent.id);
    }

    /**
     * @type {function(Number, Number): Parcel}
     */
    createParcel ( x, y ) {
        var tile = this.getTile( x, y );
        if ( !tile || tile.blocked )
            return false;
        
        // Instantiate and add to Tile
        var parcel = new Parcel( this ); // Propagate // parcel.on('reward', this.emit.bind(this, 'parcel reward') );
        tile.addParcel( parcel );

        // Grid scoped event propagation
        parcel.on( 'reward', this.emit.bind(this, 'parcel reward') );
        parcel.once( 'expired', this.emit.bind(this, 'parcel expired') );
        
        // // Tile scoped event propagation
        // parcel.on( 'reward', (...args) => parcel.tile.emit('parcel reward', ...args) );

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