const ObservableMulti = require('../reactivity/ObservableMulti');
const Xy =  require('./Xy')
const Grid =  require('./Grid')
const Agent = require('./Agent');
const Parcel = require('./Parcel');
const Postponer = require('../reactivity/Postponer');
const myClock = require('../myClock');



/**
 * @typedef SensedAgent
 * @type {import("@unitn-asa/deliveroo-js-client/types/ioTypedSocket.cjs").agent}
 */

/**
 * @typedef SensedParcel
 * @type {import("@unitn-asa/deliveroo-js-client/types/ioTypedSocket.cjs").parcel}
 */

/**
 * @class Sensor
 * @extends { ObservableMulti< {sensedAgents:SensedAgent[], sensedParcels:SensedParcel[]} > }
 */
class Sensor extends ObservableMulti {

    /** @type {Grid} #grid */
    #grid;

    /** @type {Agent} id */
    #agent;
    
    config = {};

    /** @type {SensedAgent[]} */
    sensedAgents = [];

    /** @type {SensedParcel[]} */
    sensedParcels = [];

    /** @type {Function} */
    #agentXyListener;
    
    /** @type {Function} */
    #agentDeletedListener;
    
    /** @type {Function} */
    #agentScoreListener;
    
    /** @type {Function} */
    #parcelListener;
    
    /** @type {Function} */
    #myXyListener;

    /**
     * @constructor Agent
     * @param {Grid} grid
     * @param {Agent} agent
     */
    constructor ( grid, agent ) {
        
        super(true);

        this.watch('sensedAgents', true);
        this.watch('sensedParcels', true);

        Object.assign( this.config, require('../../config') );

        this.#grid = grid;

        this.#agent = agent;

        if ( agent ) {

            this.#agentXyListener = ( event, who ) => {
                // On my movements emit agents and parcels sensing
                if ( agent.id == who.id ) {
                    this.emitAgentSensing();
                    this.emitParcelSensing();
                }
                // On others movements within my range, emit agents sensing
                else if ( !( Xy.distance(agent, who) > this.config.AGENTS_OBSERVATION_DISTANCE ) ) {
                        this.emitAgentSensing();
                    }  
            };
            grid.onAgent( 'xy', this.#agentXyListener );
            
            // On agent deleted emit agentSensing
            this.#agentDeletedListener = ( event, who ) => {
                if ( agent.id != who.id && !( Xy.distance(agent, who) >= this.config.AGENTS_OBSERVATION_DISTANCE ) ) {
                    this.emitAgentSensing()
                }
            };
            grid.onAgent( 'deleted', this.#agentDeletedListener );

            // On others score emit SensendAgents
            this.#agentScoreListener = ( event, who ) => {
                if ( agent.id != who.id && !( Xy.distance(agent, who) >= this.config.AGENTS_OBSERVATION_DISTANCE ) ) {
                    this.emitAgentSensing()
                }
            };
            grid.onAgent( 'score', this.#agentScoreListener );

            // On parcel and my movements emit parcels sensing
            this.#parcelListener = () => this.emitParcelSensing();
            grid.onParcel( this.#parcelListener );
            
            this.#myXyListener = () => this.emitParcelSensing();
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

        let sensedAgents = [];
        for ( let sensedAgent of this.#grid.agents.values() ) {
            if ( sensedAgent != this.#agent && !( Xy.distance(sensedAgent, this.#agent) >= this.config.AGENTS_OBSERVATION_DISTANCE ) ) {
                const {id, name, teamId, teamName, x: x, y: y, score, penalty} = sensedAgent
                sensedAgents.push( {id, name, teamId, teamName, x, y, score, penalty} )
            }
        }
        this.sensedAgents = sensedAgents;

    }



    /**
     * Parcels sensend on the grid
     * @type {function(): void}
     */
    emitParcelSensing () {

        var parcels = [];
        for ( const parcel of this.#grid.getParcels() ) {
            if ( !( Xy.distance(parcel, this.#agent) >= this.config.PARCELS_OBSERVATION_DISTANCE ) ) {
                let {id, x: x, y: y, carriedBy, reward} = parcel;
                parcels.push( {id, x, y, carriedBy: ( parcel.carriedBy ? parcel.carriedBy.id : null ), reward} )
            }
        }
        this.sensedParcels = parcels;

    }



}


module.exports = Sensor;
