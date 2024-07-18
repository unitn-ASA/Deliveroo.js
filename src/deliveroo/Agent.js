const Observable =  require('./Observable')
const Xy =  require('./Xy')
const Grid =  require('./Grid')
const Entity =  require('./Entity');
const Parcel =  require('../extensions/entities/Parcel');
const config =  require('../../config');
const Postponer = require('./Postponer');
const myClock = require('./Clock');
const THREE = require('three');



const MOVEMENT_STEPS = process.env.MOVEMENT_STEPS || config.MOVEMENT_STEPS || 1;
// const MOVEMENT_DURATION = process.env.MOVEMENT_DURATION || config.MOVEMENT_DURATION || 500;
// const AGENTS_OBSERVATION_DISTANCE = process.env.AGENTS_OBSERVATION_DISTANCE || config.AGENTS_OBSERVATION_DISTANCE || 5;
// const PARCELS_OBSERVATION_DISTANCE = process.env.PARCELS_OBSERVATION_DISTANCE || config.PARCELS_OBSERVATION_DISTANCE || 5;


/**
 * @class Agent
 * @extends Observable
 * @property {Set<Agent>} sensing agents in the sensed area
 */
class Agent extends Xy {

    static #lastId = 0;
    
    /** @type {Grid} #grid */
    #grid;
    /** @type {string} id */
    id;
    /** @type {string} name */
    name;
    /** @type {Set<Agent>} sensing agents in the sensed area */
    sensing;
    /** @type {Number} score */
    score = 0;
    
    /** @type {Set<Parcel>} #carryingEntities */
    #carryingEntities = new Set();
    get carryingEntities() {
        return this.#carryingEntities;
    }

    config = {};

    /**
     * @constructor Agent
     * @param {Grid} grid
     * @param {{id:number,name:string}} options
     */
    constructor ( grid, options ) {
        
        {
            // let x, y, found=false;
            // for (x=0; x<10 && !found; x++)
            //     for (y=0; y<10 && !found; y++) {
            //         found = ( grid.getTile(x, y).blocked ? false : grid.getTile(x, y).lock() );
            //         // console.log( x, y, (found?'found':'occupied') )
            //     }
            // if ( !found )
            //     throw new Error('No unlocked tiles available on the grid')
            
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

            super(x, y, 'agent');
  
        }

        let color =  Math.random() * 0xffffff ;
        let style = {shape:'cone', params:{radius:0.5, height: 1, radialSegments:32}, color: color }  
            
        this.metadata.style = style;

        Object.assign( this.config, config );
        
        Object.defineProperty (this, 'carrying', {
            get: () => Array.from(this.#carryingEntities).map( ({id, reward}) => { return {id, reward}; } ), // Recursion on carriedBy->agent->carrying->carriedBy ... 
            enumerable: false
        });

        // Emit score on score assignment
        this.interceptValueSet('score', 'score')

        // Group 'xy', 'score', 'pickup', 'putdown' => into 'agent' event
        this.on('xy', this.emitOnePerTick.bind(this, 'agent') );
        this.on('score', this.emitOnePerTick.bind(this, 'agent') );
        // this.on('pickup', this.emitOnePerTick.bind(this, 'agent') );
        // this.on('putdown', this.emitOnePerTick.bind(this, 'agent') );

        this.#grid = grid;
        this.id = options.id || 'a' + Agent.#lastId++;
        this.name = options.name || this.id;
        this.sensing = new Set();
        this.score = 0;

        this.emitOnePerTick( 'xy', this ); // emit agent when spawning
        
        // Wrapping emitParcelSensing so to fire it just once every Node.js loop iteration
        this.emitEntitySensing = new Postponer( this.emitEntitySensing.bind(this) ).at( myClock.synch() );

        // initialize the agent with the event of the grid 
        this.#grid.createAgent(this);

    }



    /**
     * Agents sensend on the grid
     */
    emitAgentSensing () {

        var agents = [];
        for ( let agent of this.#grid.getAgents() ) {
            if ( agent != this && !( Xy.distance(agent, this) >= this.config.AGENTS_OBSERVATION_DISTANCE ) ) {
                const {id, name, x, y, type, metadata, score} = agent
                agents.push( {id, name, x, y, type, metadata, score} )
            }
        }
        this.emitOnePerFrame( 'agents sensing', agents )
        
        // this.emitOnePerTick( 'agents sensing',
        //     Array.from( this.#grid.getAgents() ).filter( a => a != this && Xy.distance(a, this) < 5 ).map( ( {id, name, x, y, score} ) => { return {id, name, x, y, score} } )
        // );

        // TO-DO How to emit an empty array when no agents ?
        // for ( let agent of this.#grid.getAgents() ) {
        //     if ( Xy.distance(agent, this) < 5 ) {
        //         let {id, name, x, y, score} = agent;
        //         this.emitAccumulatedAtNextTick( 'agents sensing', {id, name, x, y, score} )
        //     }
        // }

    }



    /**
     * Parcels sensend on the grid
     */
    emitEntitySensing () {

        var entities = [];
        for ( const enitity of this.#grid.getEntities() ) {
            if ( !( Xy.distance(enitity, this) >= this.config.PARCELS_OBSERVATION_DISTANCE ) ) {
                let {id, x, y, type, metadata } = enitity;
                entities.push( {id, x, y, type, metadata} )
            }
        }
        
        this.emit( 'entities sensing', entities )

    }



    get tile() {
        return this.#grid.getTile( Math.round(this.x), Math.round(this.y) );
    }

    async stepByStep ( incr_x, incr_y ) {
        var init_x = this.x
        var init_y = this.y
        if ( MOVEMENT_STEPS ) {
            // Immediate offset by 0.6*step
            this.x = ( 100 * this.x + 100 * incr_x / MOVEMENT_STEPS * 12/20 ) / 100;
            this.y = ( 100 * this.y + 100 * incr_y / MOVEMENT_STEPS * 12/20 ) / 100;
        }
        for ( let i = 0; i < MOVEMENT_STEPS; i++ ) {
            // Wait for next step timeout = this.config.MOVEMENT_DURATION / MOVEMENT_STEPS
            // await new Promise( res => setTimeout(res, this.config.MOVEMENT_DURATION / MOVEMENT_STEPS ) )
            await myClock.synch( this.config.MOVEMENT_DURATION / MOVEMENT_STEPS );
            if ( i < MOVEMENT_STEPS - 1 ) {
                // Move by one step = 1 / MOVEMENT_STEPS
                this.x = ( 100 * this.x + 100 * incr_x / MOVEMENT_STEPS ) / 100;
                this.y = ( 100 * this.y + 100 * incr_y / MOVEMENT_STEPS ) / 100;
            }
        }
        // Finally at exact destination
        this.x = init_x + incr_x
        this.y = init_y + incr_y
    }

    moving = false;

    async move ( incr_x, incr_y ) {
        // if the agent is still moving it can not move again
        if ( this.moving ) return false;     

        // sincronize the method with the game clock 
        this.moving = true;                 
        await myClock.synch();
        this.moving = false;

        let fromTile = this.tile;
       
        // get the end tile of the move 
        let toTile = this.#grid.getTile( this.x+incr_x, this.y+incr_y );

        if(!toTile){ return }               // if the agent try to move to a Tile that not exist return the motion
        
        let tilefree = await toTile.lock(); // try lo lock the tile 
        if(!tilefree){ return}              // if the toTile is already locked stop the motion
        
        // The standard agent cen move to a tile if it is not blocked 
        if (!toTile.blocked) {
            this.moving = true;
            await this.stepByStep( incr_x, incr_y );
            this.moving = false;
            fromTile.unlock();
            return { x: this.x, y: this.y };
        }

        return false
    }

    scoring(sc){
        this.score += sc;
        if ( sc > 0 ) {
            console.log( `${this.name}(${this.id}) scores (+ ${sc} pti -> ${this.score} pti)` );
            //console.log( Array.from(this.#grid.getAgents()).map(({name,id,score})=>`${name}(${id}) ${score} pti`).join(', ') );
        }
    }

    /**
     * Pick up all parcels in the agent tile.
     * @function pickUp
     * @returns {Promise<Entity[]>} An array of entity that have been picked up
     */
    async pickUp () {
        //console.log('Agent ', this.name + ' pickUp');
        if ( this.moving )
            return [];
        this.moving = true;
        await myClock.synch();
        this.moving = false;

        const picked = new Array();
        
        for ( const  entity of this.#grid.getEntities() ) {
            if ( entity.x == this.x && entity.y == this.y ) {
                try {
                    let result = entity.pickedUp(this)
                    if(result){
                        this.#carryingEntities.add(entity);
                        picked.push( entity );
                    }
                } catch (error) {
                    console.log('The entity ', entity.id + ' is not collectible')
                }
                
            }
        }
        // console.log(this.id, 'pickUp', counter, 'parcels')
        if ( picked.length > 0 )
            this.emit( 'pickup', this, picked );
        return picked; // Array.from(this.#carryingParcels);
    }
    
    /**
     * Put down parcels:
     * - if no list is provided: put down all parcels
     * @function putDown
     * @returns {Promise<Parcel[]>} An array of parcels that have been put down
     */
    async putDown () {
        //console.log('Agent ', this.name + ' putDown');
        if ( this.moving )
            return [];

        this.moving = true;
        await myClock.synch();
        this.moving = false;

        var tile = this.tile
        var sc = 0;
        var dropped = new Array();
        
        for ( const entity of this.#carryingEntities ) {
            try {
                let result = entity.putDown(this, tile)
                if(result){
                    this.#carryingEntities.delete(entity);
                    dropped.push( entity );
                }
            } catch (error) {
                console.log(error)
                console.log('The entity ', entity.id + ' is not releasable')
            }
        }

        if ( dropped.length > 0 )
            this.emitOnePerTick( 'putdown', this, dropped );

        return dropped;
    }
    

}


module.exports = Agent;