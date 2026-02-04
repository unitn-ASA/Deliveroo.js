import Tile from './Tile.js';
import Agent from './Agent.js';
import Parcel from './Parcel.js';
import Crate from './Crate.js';
import Xy from './Xy.js';
import { config } from '../config/config.js';
import GridEventEmitter from './GridEventEmitter.js';
import Identity from './Identity.js';
import myClock from '../myClock.js';
import { atPromise } from '../reactivity/postponeAt.js';
import SpatialRegistry from './SpatialRegistry.js';
import CrateFactory from './CrateFactory.js';
import ParcelFactory from './ParcelFactory.js';
import AgentFactory from './AgentFactory.js';
import TileFactory from './TileFactory.js';

/** @typedef {import("@unitn-asa/deliveroo-js-sdk/types/IOTile.js").IOTileType} IOTileType */


// @typedef {{tiles:[Map<String,Tile>], agents:[Map<String, Agent>], parcels:[Map<String, Parcel>}]} EventsMap

/**
 * @class Grid
 */
class Grid {

    /** @property {GridEventEmitter} */
    #emitter;
    get emitter () {
        return this.#emitter;
    }



    /** @property {number} X */
    #X = 0;

    /** @property {number} Y */
    #Y = 0;
    
    // /** @type {Map<string, Tile>} */
    // #tiles;



    /** @type {SpatialRegistry<Tile>} */
    #tileRegistry;
    get tileRegistry () { return this.#tileRegistry }

    /** @type {TileFactory} */
    #tileFactory;



    /** @type {SpatialRegistry<Agent>} */
    #agentRegistry;
    get agentRegistry () { return this.#agentRegistry }

    /** @type {AgentFactory} */
    #agentFactory;



    /** @type {SpatialRegistry<Parcel>} */
    #parcelRegistry;
    get parcelRegistry () { return this.#parcelRegistry }

    /** @type {ParcelFactory} */
    #parcelFactory;



    /** @type {SpatialRegistry<Crate>} */
    #crateRegistry;
    get crateRegistry () { return this.#crateRegistry }

    /** @type {CrateFactory} */
    #crateFactory;



    /**
     * @constructor Grid
     * @param {IOTileType[][]} map
     */
    constructor ( map = new Array(10).map( c=>new Array(10) ) ) {

        this.#emitter = new GridEventEmitter();

        // Initialize spatial registries and factories
        this.#tileRegistry = new SpatialRegistry();
        this.#tileFactory = new TileFactory( this.#tileRegistry );

        this.#agentRegistry = new SpatialRegistry();
        this.#agentFactory = new AgentFactory( this.#agentRegistry );

        this.#parcelRegistry = new SpatialRegistry();
        this.#parcelFactory = new ParcelFactory( this.#parcelRegistry );
        
        this.#crateRegistry = new SpatialRegistry();
        this.#crateFactory = new CrateFactory( this.#crateRegistry );

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
        for ( const crate of this.#crateRegistry.getIterator() ) {
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
                    // Remove tile that are outside the new map dimensions
                    tile.emitter.emit( 'deleted' );
                    // this.emitTile( tile );           // So I may need to force it to happen immediately
                    this.tileRegistry.remove( xy.toString() );
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

        var tile = this.tileRegistry.getOneByXy( xy );
        if ( tile ) {
            tile.type = type;
        } else {
            tile = this.#tileFactory.create( xy, type )
            
            // if ( xy.x + 1 > this.#X ) this.#X = xy.x + 1;
            // if ( xy.y + 1 > this.#Y ) this.#Y = xy.y + 1;
            
            // Emit tile updates when its type changes
            tile.emitter.on( 'type' , (type) => this.emitter.emitTile( tile ) ); // immediate emission
            // tile.emitter.on( 'type' , atPromise(myClock.synch(), () => this.emitTile( tile ) ) ); // emission at next clock frame
            
            // Initial emission
            this.emitter.emitTile( tile );
        }

        // Create crates on tiles ending "!"
        if ( type && type.toString().endsWith('!') ) {
            const baseType = /** @type {IOTileType} */ (type.toString().slice(0, -1)); // Remove the "!"
            this.createCrate( xy );
        }

        return tile;
    }

    getMapSize () {
        return { width: this.#X, height: this.#Y }
    }

    /**
     * @type {function( Identity ): Agent}
     */
    createAgent ( identity ) {

        // Create agent using factory, it is automatically registered in spatial registry
        var me = this.#agentFactory.createAgent( this, identity );
        
        // Grid scoped event propagation
        this.emitter.emitAgent( 'created', me );

        // Grid scoped events propagation
        me.emitter.on( 'xy', () => this.emitter.emitAgent( 'xy', me ) );
        me.emitter.on( 'score', () => this.emitter.emitAgent( 'score', me ) );

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
        //     this.tileRegistry.getOneByXy(agent.xy.roundedFrom).unlock();

        agent.putDown();
        
        agent.xy = undefined;

        // Emit deleted event before removing all listeners, automatically removes from spatial registry
        agent.emitter.emit( 'deleted', agent );

        // Unsubscribe all event listeners
        agent.emitter.removeAllListeners();
        
        // Cleanup sensor listeners to prevent memory leak
        if ( agent.sensor && typeof agent.sensor.cleanup === 'function' ) {
            agent.sensor.cleanup();
        }
        
        this.emitter.emitAgent( 'deleted', agent );

    }



    /**
     * @type {function(Xy): Parcel}
     */
    createParcel ( xy ) {
        var tile = this.tileRegistry.getOneByXy( xy );
        if ( ! tile || ! tile.walkable )
            return undefined;

        // Use factory to create parcel (auto-registers with parcelRegistry)
        var parcel = this.#parcelFactory.create( xy );

        parcel.emitter.once( 'expired', (...args) => {
            this.deleteParcel( parcel.id );
        } );

        // Grid scoped event propagation
        this.emitter.emitParcel( parcel )
        parcel.emitter.on( 'reward', () => this.emitter.emitParcel( parcel ) );
        parcel.emitter.on( 'carriedBy', () => this.emitter.emitParcel( parcel ) );
        parcel.emitter.on( 'xy', () => this.emitter.emitParcel( parcel ) );

        return parcel;
    }
    


    /**
     * @type {function(String):boolean}
     */
    deleteParcel ( id ) {
        var parcel = this.parcelRegistry.get( id );
        if ( ! parcel ) return false
        
        // Call cleanup to remove clock and carrier listeners
        parcel.cleanup();

        // // Emit deleted event before removing all listeners, automatically removes from spatial registry
        // parcel.emitter.emit( 'deleted', parcel );

        // // Unsubscribe all event listeners
        // parcel.emitter?.removeAllListeners();
        
        return this.parcelRegistry.remove( id );
    }



    /**
     * @type {function(Xy): Crate}
     */
    createCrate ( xy ) {
        var tile = this.tileRegistry.getOneByXy( xy );
        if ( ! tile || ! tile.walkable )
            return undefined;

        // Use factory to create crate (auto-registers with crateRegistry)
        var crate = this.#crateFactory.create( xy );
        
        // Grid scoped event propagation
        this.emitter.emitCrate( crate );
        crate.emitter.on( 'xy', () => this.emitter.emitCrate( crate ) );

        return crate;
    }

    /**
     * @type {function(String):boolean}
     */
    deleteCrate ( id ) {
        var crate = this.#crateRegistry.get( id );

        crate.emitter.emit( 'deleted', crate )

        crate.emitter?.removeAllListeners('xy');
        
        return this.#crateRegistry.remove( id );
    }

    /**
     * @type {function(): void}
     */
    restart() {
        // console.log('Grid is restarting...');

        // Clean up tiles
        for ( const tile of this.#tileRegistry.getIterator() ) {
            tile.emitter.emit( 'deleted' );
        }

        // Clean up agents
        for ( const agent of this.#agentRegistry.getIterator() ) {
            this.deleteAgent( agent );
        }

        // Clean up parcels
        for ( const parcel of this.#parcelRegistry.getIterator() ) {
            this.deleteParcel( parcel.id );
        }

        // Clean up crates
        for ( const crate of this.#crateRegistry.getIterator() ) {
            this.deleteCrate( crate.id );
        }

    }

}


export default Grid;