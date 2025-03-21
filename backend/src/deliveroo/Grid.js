const Tile =  require('./Tile')
const Agent =  require('./Agent')
const Parcel = require('./Parcel');
const Xy = require('./Xy');
const config =  require('../../config');
const GridEventEmitter = require('./GridEventEmitter');
const Sensor = require('./Sensor');
const Identity = require('./Identity');



// @extends { ObservableMulti< {tiles:Map<String,Tile>, agents:Map<String, Agent>, parcels:Map<String, Parcel>} > }

/**
 * @class Grid
 * @extends GridEventEmitter
 */
class Grid extends GridEventEmitter {

    /** @property {number} X */
    #X = 0;

    /** @property {number} Y */
    #Y = 0;
    
    /** @type {Map<string, Tile>} */
    #tiles;

    /** @type {Map<string, Agent>} */
    #agents;
    
    get agents () {
        return this.#agents;
    }

    /** @type {Map<string, Parcel>} */
    #parcels;
    
    /**
     * @constructor Grid
     */
    constructor ( map = new Array(10).map( c=>new Array(10) ) ) {
        super();
        
        this.#tiles = new Map();
        this.#agents = new Map();
        this.#parcels = new Map();

        var Xlength = map.length;
        var Ylength = Array.from(map).reduce((longest, current) => (current.length > longest.length ? current : longest)).length;

        // Import map into #tiles
        for (let x = 0; x < Xlength; x++) {
            for (let y = 0; y < Ylength; y++) {
                const value = map[x][y];
                this.setTile( new Xy( {x,y}), value );
            }
        }

    }

    loadMap ( map ) {
        var Xlength = map.length;
        var Ylength = Array.from(map).reduce((longest, current) => (current.length > longest.length ? current : longest)).length;

        for (let x = 0; x < Math.max(Xlength,this.#X); x++) {
            for (let y = 0; y < Math.max(Ylength,this.#Y); y++) {
                let xy = new Xy( {x,y});
                if (x < Xlength && y < Ylength) {
                    let value = map[x][y];
                    this.setTile( xy, value );
                } else {
                    this.setTile( xy, '0' ); // needed to emit update, even if later deleted
                    this.#tiles.delete( xy.toString() );
                }
            }
        }

        this.#X = Xlength;
        this.#Y = Ylength;
    }

    /**
     * @function setTile
     * @param {Xy} xy
     * @param {string} type
     * @returns {void}
     */
    setTile ( xy, type ) {
        var tile = this.#tiles.get( xy.toString() );
        if ( tile ) {
            tile.type = type;
        } else {
            tile = new Tile( xy, type );
            this.#tiles.set( xy.toString(), tile );
            if ( xy.x + 1 > this.#X ) this.#X = xy.x + 1;
            if ( xy.y + 1 > this.#Y ) this.#Y = xy.y + 1;
            tile.on( 'type' , () => this.emitTile( tile ) );
        }
        this.emitTile( tile ); // not needed, ObservableMulti deep Track Map
    }

    /**
     * @type {function():Generator<Tile, void, Tile>}
     */
    *getTiles ( [x1,x2,y1,y2]=[0,10000,0,10000] ) {
        x1 = Math.max(0,x1)
        x2 = Math.min(this.#X,x2);
        y1 = Math.max(0,y1)
        y2 = Math.min(this.#Y,y2);
        // console.log(xLength, yLength, x1, x2, y1, y2)
        for ( let x = x1; x < x2; x++ ) {
            for ( let y = y1; y < y2; y++ ) {
                var tile = this.#tiles.get(`${x}_${y}`);
                if ( tile ) yield tile;
            }
        }
    }

    getMapSize () {
        return { width: this.#X, height: this.#Y }
    }

    /**
     * @type {function({x:number,y:number}): Tile}
     */
    getTile ( {x, y} ) {
        return this.#tiles.get(`${x}_${y}`);
    }

    // /**
    //  * @type {function(): MapIterator<String>}
    //  */
    // getAgentIds () {
    //     return this.#agents.keys();
    // }
    
    // getAgents () {
    //     return this.#agents.values();
    // }

    // getAgent ( id ) {
    //     return this.#agents.get( id );
    // }

    /**
     * @type {function( Identity ): Agent}
     */
    createAgent ( identity ) {

        // Instantiate
        /** @type {Agent} */
        var me = new (global.Agent || Agent)( this, identity );
        this.emitAgent( 'created', me );

        // Register
        this.#agents.set(me.id, me);

        // Grid scoped events propagation
        me.on( 'xy', () => this.emitAgent( 'xy', me ) );
        me.on( 'score', () => this.emitAgent( 'score', me ) );

        return me;
    }

    /**
     * 
     * @param {Agent} agent 
     */
    deleteAgent ( agent ) {

        if ( agent.tile )
            agent.tile.unlock();

        agent.putDown();
        
        agent.xy = undefined;

        agent.removeAllListeners('xy');
        agent.removeAllListeners('score');
        // agent.removeAllListeners('agent');
        // agent.removeAllListeners('agents sensing');
        // agent.removeAllListeners('parcels sensing');
        
        this.#agents.delete( agent.id );
        
        this.emitAgent( 'deleted', agent );

    }



    /**
     * @type {function(Xy): Parcel}
     */
    createParcel ( xy ) {
        var tile = this.getTile( xy );
        if ( ! tile || ! tile.walkable )
            return undefined;
        
        // Instantiate and add to Tile
        var parcel = new Parcel( xy );
        // tile.addParcel( parcel );
        this.#parcels.set( parcel.id, parcel )

        parcel.once( 'expired', (...args) => {
            this.deleteParcel( parcel.id );
        } );

        // Grid scoped event propagation
        this.emitParcel( parcel )
        parcel.on( 'reward', () => this.emitParcel( parcel ) );
        parcel.on( 'carriedBy', () => this.emitParcel( parcel ) );
        parcel.on( 'xy', () => this.emitParcel( parcel ) );

        return parcel;
    }

    /**
     * @type {function(string): Parcel}
     */
    getParcel (id) {
        return this.#parcels.get(id);
    }

    /**
     * @type {function(): IterableIterator<Parcel>}
     */
    getParcels () {
        return this.#parcels.values();
    }

    /**
     * @type {function(): number}
     */
    getParcelsQuantity () {
        return this.#parcels.size;
    }

    /**
     * @type {function(String):boolean}
     */
    deleteParcel ( id ) {
        var parcel = this.getParcel( id );
        if ( ! parcel ) return false
        parcel.removeAllListeners('reward');
        parcel.removeAllListeners('carriedBy');
        parcel.removeAllListeners('xy');
        return this.#parcels.delete( id );
    }

    /**
     * @type {function(): void}
     */
    restart() {
        // console.log('Grid is restarting...');
        for ( const agent of this.#agents.values() ) {
            this.deleteAgent( agent );
        }
        for ( const parcel of this.#parcels.values() ) {
            this.deleteParcel( parcel.id );
        }
    }

}


module.exports = Grid;