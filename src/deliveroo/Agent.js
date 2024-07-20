const Observable =  require('./Observable')
const Xy =  require('./Xy')
const Grid =  require('./Grid')
const config =  require('../../config');

const AGENTS_OBSERVATION_DISTANCE = config.AGENTS_OBSERVATION_DISTANCE || 5
const ENTITIES_OBSERVATION_DISTANCE = config.ENTITIES_OBSERVATION_DISTANCE || 5

/**
 * @class Agent
 * @extends Observable
 * @property {Set<Agent>} sensing agents in the sensed area
 */
class Agent extends Xy {

    static #lastId = 0;
    
    /** @type {Grid} #grid */
    grid;
    /** @type {string} id */
    id;


    /**
     * @constructor Agent
     * @param {Grid} grid
     * @param {{id:number,name:string}} options
     */
    constructor ( grid, id, name, tile, type = 'agent') {
        
        super(tile.x, tile.y, type);

        this.grid = grid;
        this.id = id || 'a' + Agent.#lastId++;

        let color =  Math.random() * 0xffffff ;
        let style = {shape:'cone', params:{radius:0.5, height: 1, radialSegments:32}, color: color }  
        
        this.set('name', name || this.id )
        this.set('style', style)
        this.set('label', this.id )
        this.set('agents_observation_distance', AGENTS_OBSERVATION_DISTANCE)  
        this.set('entities_observation_distance', ENTITIES_OBSERVATION_DISTANCE)  
       
        /* Group 'xy', 'score', 'pickup', 'putdown' => into 'agent' event
        this.on('xy', this.emitOnePerTick.bind(this, 'agent') );
        this.on('score', () =>{
            this.metadata.score = this.score
            this.emitOnePerTick.bind(this, 'agent') 
        });
        this.on('pickup', this.emitOnePerTick.bind(this, 'agent') );
        this.on('putdown', this.emitOnePerTick.bind(this, 'agent') );
        */

        this.on('xy', () => this.emitOnePerFrame('update', this) );
        
        // initialize the agent with the event of the grid 
        this.grid.addAgent(this);

    }   

    get(property){
        return this.metadata[property]
    }
    
    set(property, value){
        //console.log('SET ', property , value)
        this.metadata[property] = value
        //emit only one time at the end of the frame the update event
        this.emitOnePerFrame('update', this)
    }

    remove(property){
        if (this.metadata.hasOwnProperty(property)) {
            delete this.metadata[property];
        }
    }

    delete(){
        let tile = this.grid.getTile(Math.round(this.x), Math.round(this.y))
        if(tile){ tile.unlock(); }
        
        //agent.putDown();
        this.x = undefined;
        this.y = undefined;
        this.removeAllListeners('xy');
        this.removeAllListeners('update');
        this.removeAllListeners('agents sensing');
        this.removeAllListeners('entities sensing');

        this.grid.removeAgent(this)
    }

    /**
     * Agents sensend on the grid
     */
    emitAgentSensing () {

        var agents = [];
        for ( let agent of this.grid.getAgents() ) {
            if ( agent != this && !( Xy.distance(agent, this) >= this.get('agents_observation_distance')) ) {
                
                const {id, x, y, type, metadata} = agent
                agents.push( {id, x, y, type, metadata} )
            }
        }
        this.emitOnePerFrame( 'agents sensing', agents )
        
    }


    /**
     * Entity sensend on the grid
     */
    emitEntitySensing () {

        var entities = [];
        for ( const enitity of this.grid.getEntities() ) {
            if ( !( Xy.distance(enitity, this) >= this.get('entities_observation_distance')) ) {
                let {id, x, y, type, metadata } = enitity;
                entities.push( {id, x, y, type, metadata} )
            }
        }
        
        this.emitOnePerFrame( 'entities sensing', entities )

    }

}


module.exports = Agent;