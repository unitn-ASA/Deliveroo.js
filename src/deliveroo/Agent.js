const Observable =  require('./Observable')
const Xy =  require('./Xy')
const Grid =  require('./Grid')
const Tile =  require('./Tile');
const Parcel =  require('./Parcel');
const {MOVEMENT_STEPS} =  require('../../config');
const Postponer = require('./Postponer');
const myClock = require('./Clock');



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
    /** @type {Set<Parcel>} #carryingParcels */
    #carryingParcels = new Set();
    // get carrying () {
    //     return Array.from(this.#carryingParcels);
    // }

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
        
            super(x, y);
        }

        Object.assign( this.config, require('../../config') );
        
        Object.defineProperty (this, 'carrying', {
            get: () => Array.from(this.#carryingParcels).map( ({id, reward}) => { return {id, reward}; } ), // Recursion on carriedBy->agent->carrying->carriedBy ... 
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
        this.emitParcelSensing = new Postponer( this.emitParcelSensing.bind(this) ).at( myClock.synch() );

    }



    /**
     * Agents sensend on the grid
     * @type {function(Agent,Array<Parcel>): void}
     */
    emitAgentSensing () {

        var agents = [];
        for ( let agent of this.#grid.getAgents() ) {
            if ( agent != this && !( Xy.distance(agent, this) >= this.config.AGENTS_OBSERVATION_DISTANCE ) ) {
                const {id, name, x, y, score} = agent
                agents.push( {id, name, x, y, score} )
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
    emitParcelSensing () {

        var parcels = [];
        for ( const parcel of this.#grid.getParcels() ) {
            if ( !( Xy.distance(parcel, this) >= this.config.PARCELS_OBSERVATION_DISTANCE ) ) {
                let {id, x, y, carriedBy, reward} = parcel;
                parcels.push( {id, x, y, carriedBy: ( parcel.carriedBy ? parcel.carriedBy.id : null ), reward} )
            }
        }
        this.emit( 'parcels sensing', parcels )

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
        if ( this.moving ) // incr_x%1!=0 || incr_y%1!=0 ) // if still moving
            return false;
        this.moving = true;
        await myClock.synch();
        this.moving = false;
        let fromTile = this.tile;
        // if (!fromTile)
        //     return false;
        let toTile = this.#grid.getTile( this.x+incr_x, this.y+incr_y );
        if ( toTile && !toTile.blocked && toTile.lock() ) {
            // console.log(this.id, 'start move in', this.x+incr_x, this.y+incr_y)
            this.moving = true;
            await this.stepByStep( incr_x, incr_y );
            // console.log(this.id, 'done move in', this.x, this.y)
            this.moving = false;
            fromTile.unlock();
            // this.emitParcelSensing(); // NO! this is done outside
            return { x: this.x, y: this.y };
        }
        // console.log(this.id, 'fail move in', this.x+incr_x, this.y+incr_y)
        return false;
    }

    async up () {
        // console.log(this.id + ' move up')
        return this.move(0, 1);
    }

    async down () {
        // console.log(this.id + ' move down')
        return this.move(0, -1);
    }

    async left () {
        // console.log(this.id + ' move left')
        return this.move(-1, 0);
    }

    async right () {
        // console.log(this.id + ' move right')
        return this.move(1, 0);
    }

    /**
     * Pick up all parcels in the agent tile.
     * @function pickUp
     * @returns {Promise<Parcel[]>} An array of parcels that have been picked up
     */
    async pickUp () {
        if ( this.moving )
            return [];
        this.moving = true;
        await myClock.synch();
        this.moving = false;
        const picked = new Array();
        var counter = 0;
        for ( const /**@type {Parcel} parcel*/ parcel of this.#grid.getParcels() ) {
            if ( parcel.x == this.x && parcel.y == this.y && parcel.carriedBy == null ) {
                this.#carryingParcels.add(parcel);
                parcel.carriedBy = this;
                // parcel.x = 0;
                // parcel.y = 0;
                picked.push( parcel );
                counter++;
            }
        }
        // console.log(this.id, 'pickUp', counter, 'parcels')
        if ( picked.length > 0 )
            this.emit( 'pickup', this, picked );
        return picked; // Array.from(this.#carryingParcels);
    }

    /**
     * Put down parcels:
     * - if array of ids is provided: putdown only specified parcels
     * - if no list is provided: put down all parcels
     * @function putDown
     * @param {string[]} ids An array of parcels id
     * @returns {Promise<Parcel[]>} An array of parcels that have been put down
     */
    async putDown ( ids = [] ) {
        if ( this.moving )
            return [];
        this.moving = true;
        await myClock.synch();
        this.moving = false;
        var tile = this.tile
        var sc = 0;
        var dropped = new Array();
        var toPutDown = Array.from( this.#carryingParcels );    // put down all parcels
        if ( ids && ids.length && ids.length > 0 )              // put down specified parcels
            toPutDown = toPutDown.filter( p => ids.includes( p.id ) );
        for ( const parcel of this.#carryingParcels ) {
            this.#carryingParcels.delete(parcel);
            parcel.carriedBy = null;
            // parcel.x = this.x;
            // parcel.y = this.y;
            dropped.push( parcel );
            if ( tile.delivery ) {
                sc += parcel.reward;
                this.#grid.deleteParcel( parcel.id );
            }
        }
        this.score += sc;
        if ( sc > 0 ) {
            console.log( `${this.name}(${this.id}) putDown ${dropped.length} parcels (+ ${sc} pti -> ${this.score} pti)` );
            console.log( Array.from(this.#grid.getAgents()).map(({name,id,score})=>`${name}(${id}) ${score} pti`).join(', ') );
        }
        if ( dropped.length > 0 )
            this.emitOnePerTick( 'putdown', this, dropped );
        return dropped;
    }
}



module.exports = Agent;