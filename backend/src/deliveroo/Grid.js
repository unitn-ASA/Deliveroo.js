import Tile from './Tile.js';
import Agent from './Agent.js';
import Parcel from './Parcel.js';
import Crate from './Crate.js';
import Xy from './Xy.js';
import { config } from '../config/config.js';
import GridEventEmitter from './GridEventEmitter.js';
import SensorOfGod from './SensorOfGod.js';
import Identity from './Identity.js';
import Factory from './Factory.js';

/** @typedef {import("@unitn-asa/deliveroo-js-sdk/types/IOTile.js").IOTileType} IOTileType */


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

    /** @type {Map<string, Crate>} */
    #crates;

    /** @type {SensorOfGod} */
    #sensorOfGod;

    get sensorOfGod () {
        return this.#sensorOfGod;
    }
    
    /**
     * @constructor Grid
     * @param {IOTileType[][]} map
     */
    constructor ( map = new Array(10).map( c=>new Array(10) ) ) {
        super();
        
        this.#tiles = new Map();
        this.#agents = new Map();
        this.#parcels = new Map();
        this.#crates = new Map();

        this.loadMap( map );

        this.#sensorOfGod = new SensorOfGod( this );

    }

    /**
     * @param {IOTileType[][]} tiles
     */
    loadMap ( tiles ) {
        if ( ! Array.isArray(tiles) ) {
            console.error('Grid.js loadMap(tiles) Invalid tiles format', tiles);
            return;
        }

        // Clear existing crates when loading a new map
        for ( const crate of this.#crates.values() ) {
            this.deleteCrate( crate.id );
        }

        var Xlength = tiles.length;
        var Ylength = Array.from(tiles).reduce((longest, current) => (current.length > longest.length ? current : longest)).length;

        for (let x = 0; x < Math.max(Xlength,this.#X); x++) {
            for (let y = 0; y < Math.max(Ylength,this.#Y); y++) {
                let xy = new Xy( {x,y});
                if (x < Xlength && y < Ylength) {
                    let value = tiles[x][y];
                    // Convert value to string for consistency
                    this.setTile( xy, value );
                } else {
                    let tile = this.setTile( xy, '0' ); // Tile.watch(type) happens at clock frame, if tile got deleted, listeners are all unsubscribed.
                    // this.emitTile( tile );           // So I may need to force it to happen immediately
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
     * @param {IOTileType} type
     * @returns {Tile}
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
            tile.onFrame( 'type' , () => this.emitTile( tile ) );
        }

        // Create crates on tiles ending "!"
        if ( type && type.toString().endsWith('!') ) {
            const baseType = /** @type {IOTileType} */ (type.toString().slice(0, -1)); // Remove the "!"
            this.createCrate( xy );
        }

        // this.emitTile( tile ); // not needed Tile.type is watched with immediate = true
        return tile;
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
        var me = Factory.createAgent( this, identity );
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
    async deleteAgent ( agent ) {

        await agent.doing;

        if ( agent.tile )
            agent.tile.unlock();

        // if ( agent.xy?.roundedFrom )
        //     this.getTile(agent.xy.roundedFrom).unlock();

        agent.putDown();
        
        agent.xy = undefined;

        agent.removeAllListeners('xy');
        agent.removeAllListeners('score');
        // agent.removeAllListeners('agent');
        // agent.removeAllListeners('agents sensing');
        // agent.removeAllListeners('parcels sensing');
        
        // Cleanup sensor listeners to prevent memory leak
        if ( agent.sensor && typeof agent.sensor.cleanup === 'function' ) {
            agent.sensor.cleanup();
        }
        
        this.#agents.delete( agent.id );
        
        this.emitAgent( 'deleted', agent );

    }

    /**
     * @type {function(Xy): Agent}
     */
    getAgentAt ( xy ) {
        return Array.from(this.agents.values()).find( agent => agent.xy.rounded.equals(xy) );
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
     * @type {function(Xy): Parcel[]}
     */
    getParcelsAt ( xy ) {
        return Array.from(this.#parcels.values()).filter( p => p?.xy?.rounded?.equals(xy) );
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
        // Call cleanup to remove clock and carrier listeners
        if ( typeof parcel.cleanup === 'function' ) {
            parcel.cleanup();
        }
        return this.#parcels.delete( id );
    }



    /**
     * @type {function(Xy): Crate}
     */
    createCrate ( xy ) {
        var tile = this.getTile( xy );
        if ( ! tile || ! tile.walkable )
            return undefined;

        // Instantiate and add to Grid
        var crate = new Crate( xy );
        this.#crates.set( crate.id, crate );

        // Grid scoped event propagation
        this.emitCrate( crate );
        crate.on( 'xy', () => this.emitCrate( crate ) );

        return crate;
    }

    /**
     * @type {function(string): Crate}
     */
    getCrate (id) {
        return this.#crates.get(id);
    }

    /**
     * @type {function(): IterableIterator<Crate>}
     */
    getCrates () {
        return this.#crates.values();
    }

    /**
     * @type {function(Xy): Crate[]}
     */
    getCratesAt ( xy ) {
        return Array.from(this.#crates.values()).filter( c => c?.xy?.rounded?.equals(xy) );
    }

    /**
     * @type {function(): number}
     */
    getCratesQuantity () {
        return this.#crates.size;
    }

    /**
     * @type {function(String):boolean}
     */
    deleteCrate ( id ) {
        var crate = this.getCrate( id );
        if ( ! crate ) return false;
        crate.removeAllListeners('xy');
        return this.#crates.delete( id );
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
        for ( const crate of this.#crates.values() ) {
            this.deleteCrate( crate.id );
        }
    }

}


export default Grid;