import Tile from './Tile.js';
import Agent from './Agent.js';
import Parcel from './Parcel.js';
import Crate from './Crate.js';
import Xy from './Xy.js';
import { config } from '../config/config.js';
import EventEmitter from 'events';
import Identity from './Identity.js';
import myClock from '../myClock.js';
import AgentsLayer from './AgentsLayer.js';
import ParcelsLayer from './ParcelsLayer.js';
import CratesLayer from './CratesLayer.js';
import TilesLayer from './TilesLayer.js';
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
/** @typedef {{mapLoaded: [Grid]}} GridLifecycleEvents */

class Grid {

    /** @type {EventEmitter<GridLifecycleEvents>} */
    #emitter = new EventEmitter();
    /** @returns {EventEmitter<GridLifecycleEvents>} */
    get emitter() { return this.#emitter; }

    /** @type {Map<string, {layer: import('./SpatialLayer.js').default, listener: (event: any) => void}>} */
    #entityLayers = new Map();
    /** @type {Set<(event: any) => void>} */
    #entityLayerListeners = new Set();



    /** @type {TilesLayer} */
    #tiles;
    get tiles() { return this.#tiles; }



    /** @type {AgentsLayer} */
    #agents;
    get agents() { return this.#agents; }



    /** @type {ParcelsLayer} */
    #parcels;
    get parcels() { return this.#parcels; }



    /** @type {CratesLayer} */
    #crates;
    get crates() { return this.#crates; }



    /**
     * @constructor Grid
     * @param {string[]} map - Fixed-width map rows stored top-to-bottom
     */
    constructor ( map = new Array(10).fill('0 '.repeat(9) + '0') ) {
        this.#emitter.setMaxListeners(0);

        this.#tiles = new TilesLayer();
        this.#agents = new AgentsLayer(this);
        this.#parcels = new ParcelsLayer();
        this.#crates = new CratesLayer();

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

        // Let plugins resync their own world objects with the loaded map
        this.#emitter.emit('mapLoaded', this);
    }

    /**
     * @function setTile
     * @param {Xy} xy
     * @param {IOTileType} type
     * @returns {Tile}
     */
    setTile ( xy, type ) {

        var tile = this.#tiles.getOneByXy( xy );
        if ( tile ) {
            tile.type = type;
        } else {
            tile = this.#tiles.create( xy, type )
            
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
        var agent = this.#agents.create(identity);

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
            Array.from( this.#tiles.getIterator() )
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
        }

        return agent;
    }



    /**
     * @type {function(Xy): Parcel}
     */
    createParcel ( xy ) {
        var tile = this.#tiles.getOneByXy( xy );
        if ( ! tile || ! tile.walkable )
            return undefined;

        // Initial reward is computed here via the reward system, keeping Parcel agnostic of reward policy.
        var parcel = this.#parcels.create( xy, null, rewardDecayingSystem.calculateReward() );

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

        return parcel;
    }



    /**
     * @type {function(Xy): Crate}
     */
    createCrate ( xy ) {
        var tile = this.#tiles.getOneByXy( xy );
        if ( ! tile || ! tile.walkable )
            return undefined;

        var crate = this.#crates.create( xy );

        return crate;
    }



    /**
     * @type {function(): void}
     */
    restart() {
        // console.log('Grid is restarting...');

        // Clean up agents
        for ( const agent of this.#agents.getIterator() ) {
            agent.delete();
        }

        // Clean up parcels
        for ( const parcel of this.#parcels.getIterator() ) {
            parcel.delete();
        }

        // Clean up crates
        for ( const crate of this.#crates.getIterator() ) {
            crate.delete();
        }

        // Let plugins resync their own world objects with the current map
        this.#emitter.emit('mapLoaded', this);

    }

    registerEntityLayer(layer) {
        if (this.#entityLayers.has(layer.id)) throw new Error(`Grid: layer '${layer.id}' is already registered`);
        const listener = (event) => this.#notifyEntityLayerListeners(event);
        layer.onChanged(listener);
        this.#entityLayers.set(layer.id, { layer, listener });
        this.#notifyEntityLayerListeners({ layer, object: null, type: 'added' });
    }

    unregisterEntityLayer(id) {
        const entry = this.#entityLayers.get(id);
        if (!entry) return false;
        entry.layer.offChanged(entry.listener);
        this.#entityLayers.delete(id);
        this.#notifyEntityLayerListeners({ layer: entry.layer, object: null, type: 'removed' });
        return true;
    }

    getEntityLayers() { return Array.from(this.#entityLayers.values(), ({ layer }) => layer); }

    onEntityLayerChanged(callback) { this.#entityLayerListeners.add(callback); }
    offEntityLayerChanged(callback) { this.#entityLayerListeners.delete(callback); }
    #notifyEntityLayerListeners(event) {
        for (const callback of this.#entityLayerListeners) callback(event);
    }

}


export default Grid;
