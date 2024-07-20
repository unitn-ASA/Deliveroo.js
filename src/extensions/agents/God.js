const Grid =  require('../../deliveroo/Grid')
const Postponer = require('../../deliveroo/Postponer');
const myClock = require('../../deliveroo/Clock');
const Xy =  require('../../deliveroo/Xy')
const Parcel =  require('../entities/Parcel')

class God extends Xy{
            
    /** @type {Grid} #grid */
    #grid;
    /** @type {string} id */
    id;
    /** @type {string} name */
    name;
    /** @type {Set<Agent>} sensing agents in the sensed area */
    sensing;

    config = {};

    /**
     * @constructor God
     * @param {Grid} grid
     * @param {{id:number,name:string}} options
     */
    constructor ( grid, options, type = 'god' ) {
        
        let x = 0
        let y = 0

        super(x, y, type); 
            
        this.metadata.style = null;

        this.on('xy', this.emitOnePerTick.bind(this, 'agent') );

        this.#grid = grid;
        this.id = options.id 
        this.name = options.name || this.id;
        this.sensing = new Set();

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
            const {id, name, x, y, type, metadata, score} = agent
            agents.push( {id, name, x, y, type, metadata, score} )
        }
        this.emitOnePerFrame( 'agents sensing', agents )
        
    }


    /**
     * Parcels sensend on the grid
     */
    emitEntitySensing () {

        var entities = [];
        for ( const enitity of this.#grid.getEntities() ) {   
            let {id, x, y, type, metadata } = enitity;
            entities.push( {id, x, y, type, metadata} )
        }
        
        this.emit( 'entities sensing', entities )

    }

    get tile() {
        return this.#grid.getTile( Math.round(this.x), Math.round(this.y) );
    }

    async stepByStep ( incr_x, incr_y ) {
        var init_x = this.x
        var init_y = this.y
        
        // Finally at exact destination
        this.x = init_x + incr_x
        this.y = init_y + incr_y
    }

    moving = false;

    async move ( incr_x, incr_y ) {
        // if the agent is still moving it can not move again
        if ( this.moving ) return false;     
        
        this.moving = true;
        await this.stepByStep( incr_x, incr_y );
        this.moving = false;

    }

    //change the typo of the tile
    async click(x,y){
        
        let tile = this.#grid.getTile(x,y)

        if ( !tile ) return;

        if ( tile.blocked ) {
            tile.delivery = false;
            tile.spawner = true;
            tile.unblock();
        } else if ( tile.spawner ) {
            tile.delivery = true;
            tile.spawner = false;
        } else if ( tile.delivery ) {
            tile.delivery = false;
            tile.spawner = false;
        } else {
            tile.delivery = false;
            tile.spawner = false;
            tile.block();
        }

        this.#grid.emitOnePerTick( 'tile', tile )

    } 

    //spawn a parcel in the selected tile or if already exist one delete it
    async shiftClick(x,y){
        
        let tile = this.#grid.getTile(x,y)
        let entity = Array.from(this.#grid.getEntities()).find(e =>e.x == tile.x && e.y == tile.y)

        if(tile.spawner && !entity){        // spawn a new parcel only if the cell i a spawner cell and it not contain already an entity

            let parcel = new Parcel(tile, this.#grid)
            return 
        } 

        if(entity && entity.constructor.name == 'Parcel'){
            entity.delete()
        }

    } 

}

module.exports = God;