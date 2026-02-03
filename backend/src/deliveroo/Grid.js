import Tile from './Tile.js';
import Agent from './Agent.js';
import Parcel from './Parcel.js';
import Crate from './Crate.js';
import Xy from './Xy.js';
import { config } from '../config/config.js';
import GridEventEmitter from './GridEventEmitter.js';
import Identity from './Identity.js';
import Factory from './AgentFactory.js';
import myClock from '../myClock.js';
import { atPromise } from '../reactivity/postponeAt.js';

/** @typedef {import("@unitn-asa/deliveroo-js-sdk/types/IOTile.js").IOTileType} IOTileType */


// @typedef {{tiles:[Map<String,Tile>], agents:[Map<String, Agent>], parcels:[Map<String, Parcel>}]} EventsMap

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

    /** @type {Map<string, Parcel[]>} - Spatial index for parcels by tile position */
    #parcelsByTile = new Map();

    /** @type {Map<string, Crate[]>} - Spatial index for crates by tile position */
    #cratesByTile = new Map();
    
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
            
            // Emit tile updates when its type changes
            tile.emitter.on( 'type' , (type) => this.emitTile( tile ) ); // immediate emission
            // tile.emitter.on( 'type' , atPromise(myClock.synch(), () => this.emitTile( tile ) ) ); // emission at next clock frame
            
            // Initial emission
            this.emitTile( tile );
        }

        // Create crates on tiles ending "!"
        if ( type && type.toString().endsWith('!') ) {
            const baseType = /** @type {IOTileType} */ (type.toString().slice(0, -1)); // Remove the "!"
            this.createCrate( xy );
        }

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
        me.emitter.on( 'xy', () => this.emitAgent( 'xy', me ) );
        me.emitter.on( 'score', () => this.emitAgent( 'score', me ) );

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

        agent.emitter.removeAllListeners();
        // agent.emitter.removeAllListeners('xy');
        // agent.emitter.removeAllListeners('score');
        // agent.emitter.removeAllListeners('penalty');
        // agent.emitter.removeAllListeners('carryingParcel');
        
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

        // Add to spatial index
        const tileKey = xy.rounded.toString();
        if (!this.#parcelsByTile.has(tileKey)) {
            this.#parcelsByTile.set(tileKey, []);
        }
        this.#parcelsByTile.get(tileKey).push(parcel);

        // Track xy changes to update spatial index
        let lastTileKey = tileKey;
        parcel.emitter.on( 'xy', () => {
            // Remove from old tile in spatial index
            const oldParcels = this.#parcelsByTile.get(lastTileKey);
            if (oldParcels) {
                const index = oldParcels.indexOf(parcel);
                if (index !== -1) {
                    oldParcels.splice(index, 1);
                    if (oldParcels.length === 0) {
                        this.#parcelsByTile.delete(lastTileKey);
                    }
                }
            }
            // Add to new tile in spatial index
            const newTileKey = parcel.xy.rounded.toString();
            if (!this.#parcelsByTile.has(newTileKey)) {
                this.#parcelsByTile.set(newTileKey, []);
            }
            this.#parcelsByTile.get(newTileKey).push(parcel);
            lastTileKey = newTileKey;
        } );

        parcel.emitter.once( 'expired', (...args) => {
            this.deleteParcel( parcel.id );
        } );

        // Grid scoped event propagation
        this.emitParcel( parcel )
        parcel.emitter.on( 'reward', () => this.emitParcel( parcel ) );
        parcel.emitter.on( 'carriedBy', () => this.emitParcel( parcel ) );
        parcel.emitter.on( 'xy', () => this.emitParcel( parcel ) );

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
        // Use spatial index for O(1) lookup instead of iterating all parcels
        return this.#parcelsByTile.get( xy.toString() ) || [];
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

        // Remove from spatial index
        const tileKey = parcel.xy?.rounded?.toString();
        if (tileKey) {
            const parcelsAtTile = this.#parcelsByTile.get(tileKey);
            if (parcelsAtTile) {
                const index = parcelsAtTile.indexOf(parcel);
                if (index !== -1) {
                    parcelsAtTile.splice(index, 1);
                    if (parcelsAtTile.length === 0) {
                        this.#parcelsByTile.delete(tileKey);
                    }
                }
            }
        }

        // Unsubscribe all event listeners
        parcel.emitter?.removeAllListeners();
        // parcel.emitter.removeAllListeners('reward');
        // parcel.emitter.removeAllListeners('carriedBy');
        // parcel.emitter.removeAllListeners('xy');
        
        // Call cleanup to remove clock and carrier listeners
        parcel.cleanup();
        
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

        // Add to spatial index
        const tileKey = xy.rounded.toString();
        if (!this.#cratesByTile.has(tileKey)) {
            this.#cratesByTile.set(tileKey, []);
        }
        this.#cratesByTile.get(tileKey).push(crate);

        // Track xy changes to update spatial index
        let lastTileKey = tileKey;
        crate.emitter.on( 'xy', () => {
            // Remove from old tile in spatial index
            const oldCrates = this.#cratesByTile.get(lastTileKey);
            if (oldCrates) {
                const index = oldCrates.indexOf(crate);
                if (index !== -1) {
                    oldCrates.splice(index, 1);
                    if (oldCrates.length === 0) {
                        this.#cratesByTile.delete(lastTileKey);
                    }
                }
            }
            // Add to new tile in spatial index
            const newTileKey = crate.xy.rounded.toString();
            if (!this.#cratesByTile.has(newTileKey)) {
                this.#cratesByTile.set(newTileKey, []);
            }
            this.#cratesByTile.get(newTileKey).push(crate);
            lastTileKey = newTileKey;
        } );

        // Grid scoped event propagation
        this.emitCrate( crate );
        crate.emitter.on( 'xy', () => this.emitCrate( crate ) );

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
        // Use spatial index for O(1) lookup instead of iterating all crates
        return this.#cratesByTile.get( xy.toString() ) || [];
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

        // Remove from spatial index
        const tileKey = crate.xy?.rounded?.toString();
        if (tileKey) {
            const cratesAtTile = this.#cratesByTile.get(tileKey);
            if (cratesAtTile) {
                const index = cratesAtTile.indexOf(crate);
                if (index !== -1) {
                    cratesAtTile.splice(index, 1);
                    if (cratesAtTile.length === 0) {
                        this.#cratesByTile.delete(tileKey);
                    }
                }
            }
        }

        crate.emitter?.removeAllListeners('xy');
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