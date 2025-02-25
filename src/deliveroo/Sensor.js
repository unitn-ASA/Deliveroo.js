const ObservableMulti = require('../reactivity/ObservableMulti');
const Xy =  require('./Xy')
const Grid =  require('./Grid')
const Agent = require('./Agent');
const Parcel = require('./Parcel');
const Postponer = require('../reactivity/Postponer');
const myClock = require('./Clock');



/**
 * @typedef SensedAgent
 * @property {string} id
 * @property {string} name
 * @property {string} teamId
 * @property {string} teamName
 * @property {number} x
 * @property {number} y
 * @property {number} score
 */

/**
 * @typedef SensedParcel
 * @property {string} id
 * @property {number} x
 * @property {number} y
 * @property {string} carriedBy
 * @property {number} reward
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

            grid.onAgent( 'xy', ( event, who ) => {
                // On my movements emit agents and parcels sensing
                if ( agent.id == who.id ) {
                    this.emitAgentSensing();
                    this.emitParcelSensing();
                }
                // On others movements within my range, emit agents sensing
                else if ( !( Xy.distance(agent, who) > this.config.AGENTS_OBSERVATION_DISTANCE ) ) {
                        this.emitAgentSensing();
                    }  
            } )
            
            // On agent deleted emit agentSensing
            grid.onAgent( 'deleted', ( event, who ) => {
                if ( agent.id != who.id && !( Xy.distance(agent, who) >= this.config.AGENTS_OBSERVATION_DISTANCE ) ) {
                    this.emitAgentSensing()
                }
            } )

            // On others score emit SensendAgents
            grid.onAgent( 'score', ( event, who ) => {
                if ( agent.id != who.id && !( Xy.distance(agent, who) >= this.config.AGENTS_OBSERVATION_DISTANCE ) ) {
                    this.emitAgentSensing()
                }
            } )

            // On parcel and my movements emit parcels sensing
            grid.onParcel( () => this.emitParcelSensing() );
            agent.on( 'xy', () => this.emitParcelSensing() );

        }

        // Wrapping emitParcelSensing so to fire it just once every Node.js loop iteration
        this.emitParcelSensing = new Postponer( this.emitParcelSensing.bind(this) ).at( myClock.synch() );
        this.emitAgentSensing = new Postponer( this.emitAgentSensing.bind(this) ).at( myClock.synch() );

    }



    /**
     * Agents sensend on the grid
     * @type {function(): void}
     */
    emitAgentSensing () {

        let sensedAgents = [];
        for ( let sensedAgent of this.#grid.agents.values() ) {
            if ( sensedAgent != this.#agent && !( Xy.distance(sensedAgent, this.#agent) >= this.config.AGENTS_OBSERVATION_DISTANCE ) ) {
                const {id, name, teamId, teamName, x: x, y: y, score} = sensedAgent
                sensedAgents.push( {id, name, teamId, teamName, x, y, score} )
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
