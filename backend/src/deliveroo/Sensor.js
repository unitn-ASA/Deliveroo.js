const ObservableMulti = require('../reactivity/ObservableMulti');
const Xy =  require('./Xy')
const Grid =  require('./Grid')
const Agent = require('./Agent');
const Parcel = require('./Parcel');
const Postponer = require('../reactivity/Postponer');
const myClock = require('../myClock');



/**
 * @typedef SensedAgent
 * @type {import("@unitn-asa/types").IOAgent}
 */

/**
 * @typedef SensedParcel
 * @type {import("@unitn-asa/types").IOParcel}
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

    /** @type {(event: any, who: Agent) => void} - Grid agent xy listener */
    #agentXyListener = ( event, who ) => {
        // On my movements emit agents and parcels sensing
        if ( this.#agent.id == who.id ) {
            this.emitAgentSensing();
            this.emitParcelSensing();
        }
        // On others movements within my range, emit agents sensing
        else if ( !( Xy.distance(this.#agent, who) > this.config.AGENTS_OBSERVATION_DISTANCE ) ) {
                this.emitAgentSensing();
            }  
    };
    
    /** @type {(event: any, who: Agent) => void} - Grid agent deleted listener */
    #agentDeletedListener = ( event, who ) => {
        if ( this.#agent.id != who.id && !( Xy.distance(this.#agent, who) >= this.config.AGENTS_OBSERVATION_DISTANCE ) ) {
            this.emitAgentSensing()
        }
    }
    
    /** @type {(event: any, who: Agent) => void} - Grid agent score listener */
    #agentScoreListener = ( event, who ) => {
        if ( this.#agent.id != who.id && !( Xy.distance(this.#agent, who) >= this.config.AGENTS_OBSERVATION_DISTANCE ) ) {
            this.emitAgentSensing()
        }
    };

    /** @type {(parcel: Parcel) => void} - Grid parcel listener */
    #parcelListener = ( parcel ) => {
        if ( !( Xy.distance(this.#agent, parcel) > this.config.PARCELS_OBSERVATION_DISTANCE ) ) {
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

        Object.assign( this.config, require('../../config') );

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
