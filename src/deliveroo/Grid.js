const Observable =  require('./Observable')
const Tile =  require('./Tile')
const Agent =  require('./Agent')
const Parcel = require('./Parcel');
const Xy = require('./Xy');
const config =  require('../../config');



/**
 * @class Grid
 */
class Grid extends Observable {

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
        this.setMaxListeners(500);
        
        this.#tiles = new Map();
        this.#agents = new Map();
        this.#parcels = new Map();

        var Xlength = map.length;
        var Ylength = Array.from(map).reduce((longest, current) => (current.length > longest.length ? current : longest)).length;

        // Import map into #tiles
        for (let x = 0; x < Xlength; x++) {
            for (let y = 0; y < Ylength; y++) {
                const value = map[x][y];
                this.setTile( x, y, value );
            }
        }

    }

    loadMap ( map ) {
        var Xlength = map.length;
        var Ylength = Array.from(map).reduce((longest, current) => (current.length > longest.length ? current : longest)).length;

        for (let x = 0; x < Math.max(Xlength,this.#X); x++) {
            for (let y = 0; y < Math.max(Ylength,this.#Y); y++) {
                if (x < Xlength && y < Ylength) {
                    let value = map[x][y];
                    this.setTile( x, y, value );
                } else {
                    this.setTile( x, y, 0 ); // needed to emit update, even if later deleted
                    this.#tiles.delete(`${x}_${y}`);
                }
            }
        }
    }

    /**
     * @function setTile
     * @param {number} x
     * @param {number} y
     * @param {number} value
     * @returns {void}
     */
    setTile ( x, y, value ) {
        var tile;
        if ( this.#tiles.has(`${x}_${y}`) ) {
            tile = this.#tiles.get(`${x}_${y}`);
            value == 0 ? tile.block() : tile.unblock();
            tile.delivery = value == 2;
            tile.parcelSpawner = value == 1;
        } else {
            tile = new Tile(
                this,       // grid
                x, y,       // x, y
                value == 0, // blocked
                value == 2, // delivery // ( x==0 || x==Xlength-1 || y==0 || y==Ylength-1 ? true : false )
                value == 1  // parcelSpawner
            );
            this.#tiles.set(`${x}_${y}`, tile);
            if ( x+1 > this.#X ) this.#X = x+1;
            if ( y+1 > this.#Y ) this.#Y = y+1;
        }
        this.emit( 'tile', tile );
        if ( value == 0 ) this.emit( 'not_tile', tile );
    }

    /**
     * @type {function():Generator<Tile, Tile, Tile>}
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
     * @type {function(number,number): Tile}
     */
    getTile ( x, y ) {
        return this.#tiles.get(`${x}_${y}`);
    }

    /**
     * @type {function(): MapIterator<String>}
     */
    getAgentIds () {
        return this.#agents.keys();
    }
    
    getAgents () {
        return this.#agents.values();
    }

    getAgent ( id ) {
        return this.#agents.get( id );
    }

    /**
     * @type {function({id:string,name:string,teamName:string}): Agent}
     */
    createAgent ( options ) {
        
        // Instantiate
        var me = new (global.Agent || Agent)( this, options );
        this.emit( 'agent created', me );

        // Register
        this.#agents.set(me.id, me);

        // Grid scoped events propagation
        me.on( 'xy', this.emit.bind(this, 'agent xy') );
        me.on( 'score', this.emit.bind(this, 'agent score') );
        // me.on( 'pickup', this.emit.bind(this, 'agent pickup') );
        // me.on( 'putdown', this.emit.bind(this, 'agent putdown') );
        // me.on( 'agent', this.emit.bind(this, 'agent') );

        // On mine or others movement emit SensendAgents
        this.on( 'agent xy', ( who ) => {
            if ( me.id == who.id || !( Xy.distance(me, who) > me.config.AGENTS_OBSERVATION_DISTANCE ) ) {
                me.emitAgentSensing()
            }
        } )
        
        // On agent deleted emit agentSensing
        this.on( 'agent deleted', ( who ) => {
            if ( me.id != who.id && !( Xy.distance(me, who) >= me.config.AGENTS_OBSERVATION_DISTANCE ) ) {
                me.emitAgentSensing()
            }
        } )

        // On others score emit SensendAgents
        this.on( 'agent score', ( who ) => {
            if ( me.id != who.id && !( Xy.distance(me, who) >= me.config.AGENTS_OBSERVATION_DISTANCE ) ) {
                me.emitAgentSensing()
            }
        } )

        // On parcel and my movements emit parcels sensing
        this.on( 'parcel', () => me.emitParcelSensing() );
        me.on( 'xy', () => me.emitParcelSensing() );

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
        agent.x = undefined;
        agent.y = undefined;
        agent.removeAllListeners('xy');
        agent.removeAllListeners('score');
        agent.removeAllListeners('agent');
        agent.removeAllListeners('agents sensing');
        agent.removeAllListeners('parcels sensing');
        this.#agents.delete( agent.id );
        this.emit( 'agent deleted', agent );
    }



    /**
     * @type {function(Number, Number): Parcel}
     */
    createParcel ( x, y ) {
        var tile = this.getTile( x, y );
        if ( !tile || tile.blocked )
            return false;
        
        // Instantiate and add to Tile
        var parcel = new Parcel( x, y );
        // tile.addParcel( parcel );
        this.#parcels.set( parcel.id, parcel )

        parcel.once( 'expired', (...args) => {
            this.deleteParcel( parcel.id );
        } );

        // Grid scoped event propagation
        this.emit( 'parcel', parcel )
        parcel.on( 'reward', this.emit.bind(this, 'parcel') );
        parcel.on( 'carriedBy', this.emit.bind(this, 'parcel') );
        parcel.on( 'xy', this.emit.bind(this, 'parcel') );

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
        return this.#parcels.delete( id );
    }

}


module.exports = Grid;