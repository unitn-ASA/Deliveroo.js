import Xy from './Xy.js';
import Grid from './Grid.js';
import Agent from './Agent.js';
import Parcel from './Parcel.js';
import Crate from './Crate.js';
import myClock from '../myClock.js';
import { config } from '../config/config.js';
import eventEmitter from 'events';
import { watchProperty } from '../reactivity/watchProperty.js';

/** @typedef {import("@unitn-asa/deliveroo-js-sdk/types/IOSensing.js").IOSensing} IOSensing */



/**
 * @class Sensor
 */
class Sensor {

    /**
     * @typedef {{sensedAgents: [IOSensing[]], sensedParcels: [IOSensing[]], sensedCrates: [IOSensing[]]}} EventsMap
     * @type { eventEmitter<EventsMap> }
    */
    #emitter = new eventEmitter();
    get emitter () { return this.#emitter; }

    /** @type {Grid} #grid */
    #grid;

    /** @type {Agent} id */
    #agent;

    /** @type {IOSensing[]} */
    sensedAgents = [];

    /** @type {IOSensing[]} */
    sensedParcels = [];

    /** @type {IOSensing[]} */
    sensedCrates = [];

    #agentsDirty = true;
    #parcelsDirty = true;
    #cratesDirty = true;

    /** @type {(event: any, who: Agent) => void} - Grid agent listener */
    #agentListener = ( event, who ) => {
        // On my movements emit agents, parcels and crates sensing
        if ( this.#agent.id == who.id ) {
            this.#agentsDirty = true;
            this.#parcelsDirty = true;
            this.#cratesDirty = true;
        }
        // On others movements within my range, emit agents sensing
        else if ( !( Xy.distance(this.#agent, who) > config.GAME.player.agents_observation_distance ) ) {
                this.#agentsDirty = true;
            }
    };

    /** @type {(parcel: Parcel) => void} - Grid parcel listener */
    #parcelListener = ( parcel ) => {
        if ( !( Xy.distance(this.#agent, parcel) > config.GAME.player.parcels_observation_distance ) ) {
            this.#parcelsDirty = true;
        }
    };

    /** @type {(crate: Crate) => void} - Grid crate listener */
    #crateListener = ( crate ) => {
        if ( !( Xy.distance(this.#agent, crate) > config.GAME.player.parcels_observation_distance ) ) {
            this.#cratesDirty = true;
        }
    };

    /** @type {(event: any) => void} - Agent xy listener */
    #myXyListener = ( event ) => {
        this.#agentsDirty = true;
        this.#parcelsDirty = true;
        this.#cratesDirty = true;
    };

    /**
     * @constructor Agent
     * @param {Grid} grid
     * @param {Agent} agent
     */
    constructor ( grid, agent ) {

        this.#emitter.setMaxListeners(0); // unlimited listeners

        watchProperty({
            target: this,
            key: 'sensedAgents',
            callback: (target, key, value) => target.#emitter.emit(key, value)
        });

        watchProperty({
            target: this,
            key: 'sensedParcels',
            callback: (target, key, value) => target.#emitter.emit(key, value)
        });

        watchProperty({
            target: this,
            key: 'sensedCrates',
            callback: (target, key, value) => target.#emitter.emit(key, value)
        });

        this.#grid = grid;

        this.#agent = agent;

        if ( agent ) {

            // On my changes emit agents, parcels and crates sensing,
            // on others changes within my range, emit agents sensing
            grid.emitter.onAgent( 'xy', this.#agentListener );
            grid.emitter.onAgent( 'deleted', this.#agentListener );
            grid.emitter.onAgent( 'score', this.#agentListener );

            // On parcel and my movements emit parcels sensing
            grid.emitter.onParcel( this.#parcelListener );

            // On crate and my movements emit crates sensing
            grid.emitter.onCrate( this.#crateListener );

            // On my movements emit parcels and crates sensing
            // agent.emitter?.on( 'xy', this.#myXyListener );

        }

        // Fire on each frame if dirty
        myClock.on('frame', () => {
            if (this.#agentsDirty) {
                this.#agentsDirty = false;
                this.computeAgentSensing();
            }

            if (this.#parcelsDirty) {
                this.#parcelsDirty = false;
                this.computeParcelSensing();
            }

            if (this.#cratesDirty) {
                this.#cratesDirty = false;
                this.computeCrateSensing();
            }
        });

    }

    /**
     * Cleanup method to remove event listeners and prevent memory leaks
     */
    cleanup() {
        if ( this.#agentListener ) {
            this.#grid.emitter.offAgent( this.#agentListener );
        }
        if ( this.#parcelListener ) {
            this.#grid.emitter.offParcel( this.#parcelListener );
        }
        if ( this.#crateListener ) {
            this.#grid.emitter.offCrate( this.#crateListener );
        }
        if ( this.#myXyListener && this.#agent ) {
            this.#agent.emitter?.off( 'xy', this.#myXyListener );
        }
    }



    /**
     * Agents sensend on the grid
     * @type {function(): void}
     */
    computeAgentSensing () {

        /** @type {Array<IOSensing>} */
        let observedTiles = [];

        // for each tile on the grid
        for ( let tile of this.#grid.tileRegistry.getIterator() ) {
            // only if my position is undefined OR if within observation distance
            if ( ( this.#agent.x == undefined && this.#agent.y == undefined ) || Xy.distance(tile, this.#agent) < config.GAME.player.agents_observation_distance ) {
                // agent sensed on this tile, assume at most one agent per tile
                const sensedAgent = this.#grid.agentRegistry.getByXy( tile.xy )[0];
                // if defined and not myself
                if ( sensedAgent && sensedAgent != this.#agent )
                    observedTiles.push( {x: tile.x, y: tile.y, agent: {
                        id: sensedAgent.id,
                        name: sensedAgent.name,
                        teamId: sensedAgent.teamId,
                        teamName: sensedAgent.teamName,
                        x: sensedAgent.x,
                        y: sensedAgent.y,
                        score: sensedAgent.score,
                        penalty: sensedAgent.penalty
                    } } );
                // no agent sensed on this tile
                else
                    observedTiles.push( { x: tile.x, y: tile.y } );
                // if (sensedAgent && sensedAgent != this.#agent) console.log('Sensor.js', this.#agent.id, 'sensing', sensedAgent.id, 'at', sensedAgent.x, sensedAgent.y);
            }
        }

        // console.log('Sensor.js', this.#agent.id, 'sensing', observedTiles.filter( t => t.agent != undefined ).length, 'agents out of', observedTiles.length, 'tiles');

        this.sensedAgents = observedTiles;

    }



    /**
     * Parcels sensend on the grid
     * @type {function(): void}
     */
    computeParcelSensing () {

        var observedTiles = [];
        // Use a Set to track tiles with parcels, avoiding duplicates
        const tilesWithParcels = new Set();

        // Iterate directly over parcels instead of all tiles - O(parcels) instead of O(tiles * parcels)
        for ( let parcel of this.#grid.parcelRegistry.getIterator() ) {
            // only if my position is undefined OR if within observation distance
            if ( ( this.#agent.x == undefined && this.#agent.y == undefined ) || Xy.distance(parcel, this.#agent) < config.GAME.player.parcels_observation_distance ) {
                const x = Math.round(parcel.x);
                const y = Math.round(parcel.y);
                const key = `${x}_${y}`;
                tilesWithParcels.add(key);
                observedTiles.push( {x, y, parcel: {
                    id: parcel.id,
                    x: parcel.x,
                    y: parcel.y,
                    carriedBy: parcel.carriedBy ? parcel.carriedBy.id : null,
                    reward: parcel.reward
                } } );
            }
        }

        // Add empty tiles within observation distance
        for ( let tile of this.#grid.tileRegistry.getIterator() ) {
            const key = `${tile.x}_${tile.y}`;
            if ( ! tilesWithParcels.has(key) ) {
                // only if my position is undefined OR if within observation distance
                if ( ( this.#agent.x == undefined && this.#agent.y == undefined ) || Xy.distance(tile, this.#agent) < config.GAME.player.parcels_observation_distance ) {
                    observedTiles.push( { x: tile.x, y: tile.y } );
                }
            }
        }

        this.sensedParcels = observedTiles;

    }



    /**
     * Crates sensed on the grid
     * @type {function(): void}
     */
    computeCrateSensing () {

        var observedTiles = [];
        // Use a Set to track tiles with crates, avoiding duplicates
        const tilesWithCrates = new Set();

        // Iterate directly over crates instead of all tiles - O(crates) instead of O(tiles * crates)
        for ( let crate of this.#grid.crateRegistry.getIterator() ) {
            // only if my position is undefined OR if within observation distance
            if ( ( this.#agent.x == undefined && this.#agent.y == undefined ) || Xy.distance(crate, this.#agent) < config.GAME.player.parcels_observation_distance ) {
                const x = Math.round(crate.x);
                const y = Math.round(crate.y);
                const key = `${x}_${y}`;
                tilesWithCrates.add(key);
                observedTiles.push( {x, y, crate: {
                    id: crate.id,
                    x: crate.x,
                    y: crate.y
                } } );
            }
        }

        // Add empty tiles within observation distance
        for ( let tile of this.#grid.tileRegistry.getIterator() ) {
            const key = `${tile.x}_${tile.y}`;
            if ( ! tilesWithCrates.has(key) ) {
                // only if my position is undefined OR if within observation distance
                if ( ( this.#agent.x == undefined && this.#agent.y == undefined ) || Xy.distance(tile, this.#agent) < config.GAME.player.parcels_observation_distance ) {
                    observedTiles.push( { x: tile.x, y: tile.y } );
                }
            }
        }

        this.sensedCrates = observedTiles;

    }



}


export default Sensor;
