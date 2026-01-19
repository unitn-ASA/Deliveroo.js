import ObservableMulti from '../reactivity/ObservableMulti.js';
import Xy from './Xy.js';
import Grid from './Grid.js';
import Agent from './Agent.js';
import Parcel from './Parcel.js';
import Crate from './Crate.js';
import Postponer from '../reactivity/Postponer.js';
import myClock from '../myClock.js';
import { config } from '../config/config.js';

/** @typedef {import("@unitn-asa/deliveroo-js-sdk/types/IOAgent.js").IOAgent} IOAgent */
/** @typedef {import("@unitn-asa/deliveroo-js-sdk/types/IOParcel.js").IOParcel} IOParcel */
/** @typedef {import("@unitn-asa/deliveroo-js-sdk/types/IOSensing.js").IOSensing} IOSensing */



/**
 * @class Sensor
 * @extends { ObservableMulti< {sensedAgents:IOSensing[], sensedParcels:IOSensing[], sensedCrates:IOSensing[]} > }
 */
class Sensor extends ObservableMulti {

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

        super(true);

        this.watch('sensedAgents', true);
        this.watch('sensedParcels', true);
        this.watch('sensedCrates', true);

        this.#grid = grid;

        this.#agent = agent;

        if ( agent ) {

            // On my changes emit agents, parcels and crates sensing,
            // on others changes within my range, emit agents sensing
            grid.onAgent( 'xy', this.#agentListener );
            grid.onAgent( 'deleted', this.#agentListener );
            grid.onAgent( 'score', this.#agentListener );

            // On parcel and my movements emit parcels sensing
            grid.onParcel( this.#parcelListener );

            // On crate and my movements emit crates sensing
            grid.onCrate( this.#crateListener );

            // On my movements emit parcels and crates sensing
            agent.on( 'xy', this.#myXyListener );

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
            this.#grid.offAgent( 'xy', this.#agentListener );
            this.#grid.offAgent( 'deleted', this.#agentListener );
            this.#grid.offAgent( 'score', this.#agentListener );
        }
        if ( this.#parcelListener ) {
            this.#grid.offParcel( this.#parcelListener );
        }
        if ( this.#crateListener ) {
            this.#grid.offCrate( this.#crateListener );
        }
        if ( this.#myXyListener && this.#agent ) {
            this.#agent.off( 'xy', this.#myXyListener );
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
        for ( let tile of this.#grid.getTiles() ) {
            // only if my position is undefined OR if within observation distance
            if ( ( this.#agent.x == undefined && this.#agent.y == undefined ) || Xy.distance(tile, this.#agent) < config.GAME.player.agents_observation_distance ) {
                // agent sensed on this tile
                const sensedAgent = this.#grid.getAgentAt( tile.xy ) ;
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
        for ( let tile of this.#grid.getTiles() ) {
            // only if my position is undefined OR if within observation distance
            if ( ( this.#agent.x == undefined && this.#agent.y == undefined ) || Xy.distance(tile, this.#agent) < config.GAME.player.parcels_observation_distance ) {
                const sensedParcels = this.#grid.getParcelsAt( tile.xy );
                for ( let parcel of sensedParcels ) {
                    // At least one parcel sensed on this tile
                    observedTiles.push( {x: tile.x, y: tile.y, parcel: {
                        id: parcel.id,
                        x: parcel.x,
                        y: parcel.y,
                        carriedBy: parcel.carriedBy ? parcel.carriedBy.id : null,
                        reward: parcel.reward
                    } } )
                }
                if ( sensedParcels.length == 0 ) {
                    // No parcel sensed on this tile
                    observedTiles.push( { x: tile.x, y: tile.y } )
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
        for ( let tile of this.#grid.getTiles() ) {
            // only if my position is undefined OR if within observation distance
            if ( ( this.#agent.x == undefined && this.#agent.y == undefined ) || Xy.distance(tile, this.#agent) < config.GAME.player.parcels_observation_distance ) {
                const sensedCrates = this.#grid.getCratesAt( tile.xy );
                for ( let crate of sensedCrates ) {
                    // At least one crate sensed on this tile
                    observedTiles.push( {x: tile.x, y: tile.y, crate: {
                        id: crate.id,
                        x: crate.x,
                        y: crate.y
                    } } )
                }
                if ( sensedCrates.length == 0 ) {
                    // No crate sensed on this tile
                    observedTiles.push( { x: tile.x, y: tile.y } )
                }
            }
        }
        this.sensedCrates = observedTiles;

    }



}


export default Sensor;
