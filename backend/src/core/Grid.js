import Tile from './Tile.js';
import Agent from './Agent.js';
import Parcel from './Parcel.js';
import Crate from './Crate.js';
import Xy from './Xy.js';
import { config } from '../config/config.js';
import GridEventEmitter from './GridEventEmitter.js';
import Identity from './Identity.js';
import myClock from '../myClock.js';
import SpatialRegistry from './SpatialRegistry.js';
import CrateFactory from './CrateFactory.js';
import ParcelFactory from './ParcelFactory.js';
import AgentFactory from './AgentFactory.js';
import TileFactory from './TileFactory.js';
import RewardDecayingSystem from '../systems/RewardDecayingSystem.js';
import MapLoadingSystem from '../systems/MapLoadingSystem.js';
import { atNextTick } from '../reactivity/postponeAt.js';
import { agentComponentRegistry } from '../agentComponents/registry.js';

// Shared reward policy system for parcel creation and decay
const rewardDecayingSystem = new RewardDecayingSystem();
// Shared map loading utility (stateless; grid passed per call)
const mapLoadingSystem = new MapLoadingSystem();

/** @typedef {import("@unitn-asa/deliveroo-js-sdk/types/IOTile.js").IOTileType} IOTileType */


// @typedef {{tiles:[Map<String,Tile>], agents:[Map<String, Agent>], parcels:[Map<String, Parcel>}]} EventsMap

/**
 * @class Grid
 */
class Grid {

    /** @property {import('./GridEventEmitter.js').GridEventEmitter} */
    #emitter;
    get emitter () {
        return this.#emitter;
    }



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
     * @param {string[]} map - Fixed-width map rows stored top-to-bottom
     */
    constructor ( map = new Array(10).fill('0 '.repeat(9) + '0') ) {

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
     * @param {string[]} tiles - Fixed-width map rows stored top-to-bottom
     */
    loadMap ( tiles ) {
        // Use MapLoadingSystem to handle map loading
        const result = mapLoadingSystem.loadMap(this, tiles);

        if (!result.success) {
            console.error('Grid.js loadMap(tiles) failed:', result.error);
            return;
        }
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
            
            // Emit tile updates when its type changes
            tile.emitter.on( 'type' , (type) => this.emitter.emitTile( tile ) ); // immediate emission
            // tile.emitter.on( 'type' , atPromise(myClock.synch(), () => this.emitTile( tile ) ) ); // emission at next clock frame

            // Emit tile update when deleted
            tile.emitter.on( 'deleted', () => this.emitter.emitTile( tile ) );
            
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

    /**
     * @type {function( Identity ): Agent}
     */
    createAgent ( identity ) {

        // Create agent using factory, it is automatically registered in spatial registry
        var agent = this.#agentFactory.createAgent( this, identity );

        // Attach the default preset: components register commands on agent.commands
        try {
            agentComponentRegistry.applyPreset(agent, config.GAME.player.agent_preset);
        } catch (error) {
            console.warn(`Grid.createAgent(): ${error.message}; falling back to 'standard' preset`);
            try {
                agentComponentRegistry.applyPreset(agent, 'standard');
            } catch (fallbackError) {
                console.error(`Grid.createAgent(): cannot attach 'standard' preset (${fallbackError.message}); agent created without command components`);
            }
        }

        // Initial position
        let tiles_unlocked =
            Array.from( this.tileRegistry.getIterator() )
            // walkable
            .filter( t => t.walkable )
            // not locked
            .filter( t => ! t.locked )
        if ( tiles_unlocked.length > 0 ) {
            // Pick a random tile among unlocked and walkable tiles
            const tile = tiles_unlocked.at( Math.floor( Math.random() * tiles_unlocked.length - 0.001 ) );
            // Lock the tile
            tile.lock();
            // Set agent position
            agent.xy = tile.xy;
        }
        else {
            console.warn('Grid.createAgent(): No tiles available, agent created without position.');
            // tile = this.tileRegistry.getIterator().next().value;
        }

        // Propagate events at Grid-scope when agent properties change
        agent.emitter.on( 'xy', () => this.emitter.emitAgentXy( agent ) );
        agent.emitter.on( 'score', () => this.emitter.emitAgentScore( agent ) );
        agent.emitter.on( 'deleted', () => this.emitter.emitAgentDeleted( agent ) );
        
        // Finally, emit 'created' event after setting up everything else
        this.emitter.emitAgentCreated( agent );


        return agent;
    }



    /**
     * @type {function(Xy): Parcel}
     */
    createParcel ( xy ) {
        var tile = this.tileRegistry.getOneByXy( xy );
        if ( ! tile || ! tile.walkable )
            return undefined;

        // Use factory to create parcel (auto-registers with parcelRegistry)
        // Initial reward is computed here via the reward system, keeping Parcel agnostic of reward policy
        var parcel = this.#parcelFactory.create( xy, null, rewardDecayingSystem.calculateReward() );

        parcel.emitter.once( 'expired', (...args) => {
            parcel.delete();
        } );


        
        // Carrier following logic: when parcel is picked up, it should follow the carrier's position; when dropped, it should stop following
        const carrierListener = (xy) => {
            if ( parcel.carriedBy ) parcel.xy = parcel.carriedBy.xy;
        };
        /** @type {Agent} */
        var lastCarrier = null;
        parcel.emitter.on( 'carriedBy', atNextTick( () => {
            // Unsubscribe from last carrier xy changes
            lastCarrier?.emitter?.off( 'xy', carrierListener );
            // Subscribe to new carrier xy changes
            parcel.carriedBy?.emitter?.on( 'xy', carrierListener );
            // Update parcel position to carrier position immediately
            carrierListener( parcel.xy );
            // Update last carrier reference
            lastCarrier = parcel.carriedBy;
        } ) );
        // Ensure we unsubscribe from carrier xy changes when parcel is deleted to prevent memory leaks
        parcel.emitter.once( 'deleted', () => {
            // Unsubscribe from carrier xy changes
            lastCarrier?.emitter?.off( 'xy', carrierListener );
        } );



        // Set up decay listener on clock, delegating reward policy to the system
        const decayListener = () => rewardDecayingSystem.decayParcel(parcel);
        const decaying_event = config.GAME.parcels.decaying_event;
        myClock.on(decaying_event, decayListener);
        // Ensure we unsubscribe from clock events when parcel is deleted to prevent memory leaks
        parcel.emitter.once( 'deleted', () => {
            myClock.off(decaying_event, decayListener);
        } );



        // Emit expire when reward reaches 0: done inside Parcel.js

        // Grid scoped event propagation
        this.emitter.emitParcel( parcel )
        parcel.emitter.on( 'reward', () => this.emitter.emitParcel( parcel ) );
        parcel.emitter.on( 'carriedBy', () => this.emitter.emitParcel( parcel ) );
        parcel.emitter.on( 'xy', () => this.emitter.emitParcel( parcel ) );

        return parcel;
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
        crate.emitter.once( 'deleted', () => this.emitter.emitCrate( crate ) );

        return crate;
    }



    /**
     * @type {function(): void}
     */
    restart() {
        // console.log('Grid is restarting...');

        // Clean up tiles
        // for ( const tile of this.#tileRegistry.getIterator() ) {
        //     tile.emitter.emit( 'deleted' );
        // }

        // Clean up agents
        for ( const agent of this.#agentRegistry.getIterator() ) {
            agent.delete();
        }

        // Clean up parcels
        for ( const parcel of this.#parcelRegistry.getIterator() ) {
            parcel.delete();
        }

        // Clean up crates
        for ( const crate of this.#crateRegistry.getIterator() ) {
            crate.delete();
        }

    }

}


export default Grid;
