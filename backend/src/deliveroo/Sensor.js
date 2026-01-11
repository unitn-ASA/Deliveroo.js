import ObservableMulti from '../reactivity/ObservableMulti.js';
import Xy from './Xy.js';
import Grid from './Grid.js';
import Agent from './Agent.js';
import Parcel from './Parcel.js';
import Postponer from '../reactivity/Postponer.js';
import myClock from '../myClock.js';
import { config } from '../config/config.js';



/**
 * @typedef {import("@unitn-asa/deliveroo-js-sdk").IOAgent} IOAgent
 */

/**
 * @typedef {import("@unitn-asa/deliveroo-js-sdk").IOParcel} IOParcel
 */

/**
 * @typedef {import("@unitn-asa/deliveroo-js-sdk").IOSensing} IOSensing
 */

/**
 * @class Sensor
 * @extends { ObservableMulti< {sensedAgents:IOSensing[], sensedParcels:IOSensing[]} > }
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

    /** @type {(event: any, who: Agent) => void} - Grid agent xy listener */
    #agentXyListener = ( event, who ) => {
        // On my movements emit agents and parcels sensing
        if ( this.#agent.id == who.id ) {
            this.emitAgentSensing();
            this.emitParcelSensing();
        }
        // On others movements within my range, emit agents sensing
        else if ( !( Xy.distance(this.#agent, who) > config.GAME.player.agents_observation_distance ) ) {
                this.emitAgentSensing();
            }  
    };
    
    /** @type {(event: any, who: Agent) => void} - Grid agent deleted listener */
    #agentDeletedListener = ( event, who ) => {
        if ( this.#agent.id != who.id && !( Xy.distance(this.#agent, who) >= config.GAME.player.agents_observation_distance ) ) {
            this.emitAgentSensing()
        }
    }
    
    /** @type {(event: any, who: Agent) => void} - Grid agent score listener */
    #agentScoreListener = ( event, who ) => {
        if ( this.#agent.id != who.id && !( Xy.distance(this.#agent, who) >= config.GAME.player.agents_observation_distance ) ) {
            this.emitAgentSensing()
        }
    };

    /** @type {(parcel: Parcel) => void} - Grid parcel listener */
    #parcelListener = ( parcel ) => {
        if ( !( Xy.distance(this.#agent, parcel) > config.GAME.player.parcels_observation_distance ) ) {
            this.emitParcelSensing();
        }
    };

    /** @type {(event: any) => void} - Agent xy listener */
    #myXyListener = ( event ) => {
        this.emitParcelSensing();
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

        this.#grid = grid;

        this.#agent = agent;

        if ( agent ) {

            // On my movements emit agents and parcels sensing,
            // on others movements within my range, emit agents sensing
            grid.onAgent( 'xy', this.#agentXyListener );
            
            // On agent deleted emit agentSensing
            grid.onAgent( 'deleted', this.#agentDeletedListener );

            // On others score emit SensendAgents
            grid.onAgent( 'score', this.#agentScoreListener );

            // On parcel and my movements emit parcels sensing
            grid.onParcel( this.#parcelListener );
            
            // On my movements emit parcels sensing
            agent.on( 'xy', this.#myXyListener );

        }

        // Wrapping emitParcelSensing so to fire it just once every Node.js loop iteration
        this.emitParcelSensing = new Postponer( this.emitParcelSensing.bind(this) ).at( myClock.synch() );
        this.emitAgentSensing = new Postponer( this.emitAgentSensing.bind(this) ).at( myClock.synch() );

    }

    /**
     * Cleanup method to remove event listeners and prevent memory leaks
     */
    cleanup() {
        if ( this.#agentXyListener ) {
            this.#grid.offAgent( 'xy', this.#agentXyListener );
        }
        if ( this.#agentDeletedListener ) {
            this.#grid.offAgent( 'deleted', this.#agentDeletedListener );
        }
        if ( this.#agentScoreListener ) {
            this.#grid.offAgent( 'score', this.#agentScoreListener );
        }
        if ( this.#parcelListener ) {
            this.#grid.offParcel( this.#parcelListener );
        }
        if ( this.#myXyListener && this.#agent ) {
            this.#agent.off( 'xy', this.#myXyListener );
        }
    }



    /**
     * Agents sensend on the grid
     * @type {function(): void}
     */
    emitAgentSensing () {

        /** @type {Array<IOSensing>} */
        let observedTiles = [];

        // for each tile on the grid
        for ( let tile of this.#grid.getTiles() ) {
            // only if within observation distance OR if my position is undefined
            if ( Xy.distance(tile, this.#agent) < config.GAME.player.agents_observation_distance || ( this.#agent.x == undefined && this.#agent.y == undefined ) ) {
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
    emitParcelSensing () {

        var observedTiles = [];
        for ( let tile of this.#grid.getTiles() ) {
            if ( !( Xy.distance(tile, this.#agent) >= config.GAME.player.parcels_observation_distance ) ) {
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



}


export default Sensor;
