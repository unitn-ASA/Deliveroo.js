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
    constructor ( grid, options, type = 'agent' ) {
        
        {
            let tiles_unlocked =
                Array.from( grid.getTiles() )
                // not locked
                .filter( t => ! t.blocked )
                // not locked
                .filter( t => ! t.locked )

                
            if ( tiles_unlocked.length == 0 )
                throw new Error('No unlocked tiles available on the grid')

            let i = Math.floor( Math.random() * tiles_unlocked.length - 1 )
            let tile = tiles_unlocked.at( i )
            let x = tile.x, y = tile.y;

            super(x, y, type);
  
        }

        this.grid = grid;
        this.id = options.id || 'a' + Agent.#lastId++;

        let color =  Math.random() * 0xffffff ;
        let style = {shape:'cone', params:{radius:0.5, height: 1, radialSegments:32}, color: color }  
        
        this.set('name', options.name || this.id )
        this.set('style', style)
        this.set('label', this.id+'/n'+this.score)
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

        this.on('xy', () => this.emitOnePerTick('update', this) );
        
        // initialize the agent with the event of the grid 
        this.grid.addAgent(this);

    }   

    get(property){
        return  this.metadata[property]
    }
    
    set(property, value){
        //console.log('SET ', property , value)
        this.metadata[property] = value
        //emit only one time at the end of the frame the update event
        this.postponeAtNextFrame( this.emit.bind(this) )('update', this)
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