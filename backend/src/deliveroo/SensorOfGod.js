import ObservableMulti from '../reactivity/ObservableMulti.js';
import Grid from './Grid.js';
import Agent from './Agent.js';
import Parcel from './Parcel.js';
import Postponer from '../reactivity/Postponer.js';
import myClock from '../myClock.js';



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
class SensorOfGod extends ObservableMulti {

    /** @type {Grid} #grid */
    #grid;

    /** @type {IOSensing[]} */
    sensedAgents = [];

    /** @type {IOSensing[]} */
    sensedParcels = [];

    /** @type {(event: any, who: Agent) => void} - Grid agent listener */
    #agentListener = ( event, who ) => {
        // On others xy, deleted, or score, emit agents sensing
        this.emitAgentSensing();  
    };

    /** @type {(parcel: Parcel) => void} - Grid parcel listener */
    #parcelListener = ( parcel ) => {
        this.emitParcelSensing();
    };

    /**
     * @constructor Agent
     * @param {Grid} grid
     */
    constructor ( grid ) {
        
        super(true);

        this.watch('sensedAgents', true);
        this.watch('sensedParcels', true);

        this.#grid = grid;

        // On my movements emit agents and parcels sensing,
        // on others xy, deleted, or score, emit agents sensing
        grid.onAgent( 'xy', this.#agentListener );
        grid.onAgent( 'deleted', this.#agentListener );
        grid.onAgent( 'score', this.#agentListener );

        // On parcel, emit parcels sensing
        grid.onParcel( this.#parcelListener );

        // Wrapping emitParcelSensing so to fire it just once every Node.js loop iteration
        this.emitParcelSensing = new Postponer( this.emitParcelSensing.bind(this) ).at( myClock.synch() );
        this.emitAgentSensing = new Postponer( this.emitAgentSensing.bind(this) ).at( myClock.synch() );

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
    }



    /**
     * Agents sensend on the grid
     * @type {function(): void}
     */
    emitAgentSensing () {

        let observedTiles = [];
        for ( let tile of this.#grid.getTiles() ) {
            const sensedAgent = this.#grid.getAgentAt( tile.xy ) ;
            observedTiles.push( {x: tile.x, y: tile.y, agent: sensedAgent } )
        }
        this.sensedAgents = observedTiles;

    }



    /**
     * Parcels sensend on the grid
     * @type {function(): void}
     */
    emitParcelSensing () {

        var observedTiles = [];
        for ( let tile of this.#grid.getTiles() ) {
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
        this.sensedParcels = observedTiles;

    }



}


export default SensorOfGod;
