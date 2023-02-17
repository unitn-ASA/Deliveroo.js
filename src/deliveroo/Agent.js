const Observable =  require('../utils/Observable')
const Xy =  require('./Xy')
const Grid =  require('./Grid')
const Tile =  require('./Tile');
const Parcel =  require('./Parcel');



const MOVEMENT_DURATION = 500;


/**
 * @class Agent
 * @extends Observable
 * @property {Set<Agent>} sensing agents in the sensed area
 */
class Agent extends Xy {

    static #lastId = 0;
    
    /** @property {Grid} #grid */
    #grid;
    /** @property {string} id */
    id;
    /** @property {string} name */
    name;
    /** @property {Set<Agent>} sensing agents in the sensed area */
    sensing;
    /** @property {Number} score */
    score = 0;
    /** @property {Set<Parcel>} #carryingParcels */
    #carryingParcels = new Set();
    // get carrying () {
    //     return Array.from(this.#carryingParcels);
    // }

    /**
     * @constructor Agent
     * @param {Grid} grid
     * @param {string} name
     * @param {string} password
     */
    constructor ( grid, name = null, password = null ) {

        {
            let x, y, found=false;
            for (x=0; x<10 && !found; x++)
                for (y=0; y<10 && !found; y++) {
                    found = ( grid.getTile(x, y).blocked ? false : grid.getTile(x, y).lock() );
                    // console.log( x, y, (found?'found':'occupied') )
                }
            if ( !found )
                throw new Error('no unlocked available tiles on the grid')

            super(--x, --y);
        }
        
        Object.defineProperty (this, 'carrying', {
            get: () => Array.from(this.#carryingParcels).map( ({id, reward}) => { return {id, reward}; } ), // Recursion on carriedBy->agent->carrying->carriedBy ... 
            enumerable: true
        });

        // Emit score on score assignment
        this.interceptValueSet('score', 'score')

        // Group 'xy', 'score', 'pickup', 'putdown' => into 'agent' event
        this.on('xy', this.emitOnePerTick.bind(this, 'agent') );
        this.on('score', this.emitOnePerTick.bind(this, 'agent') );
        this.on('pickup', this.emitOnePerTick.bind(this, 'agent') );
        this.on('putdown', this.emitOnePerTick.bind(this, 'agent') );

        this.#grid = grid;
        this.id = 'a_' + Agent.#lastId++;
        this.name = ( name ? name : this.id );
        this.password = password;
        this.sensing = new Set();
        this.score = 0;

    }

    /**
     * Agents sensend on the grid
     * @type {function(Agent,Array<Parcel>): void}
     */
    emitAgentSensing () {
        // var agents = [];
        // for ( let agent of this.#agents ) {
        //     if ( Xy.distance(agent, me) < 5 ) {
        //         let {id, x, y, score} = agent;
        //         agents.push( {id, x, y, score} )
        //     }
        // }
        // me.emitOnePerTick( 'sensing agents', agents )
        
        this.emitOnePerTick( 'agents sensing',
            Array.from( this.#grid.getAgents() ).filter( a => a != this && Xy.distance(a, this) < 5 ).map( ( {id, x, y, score} ) => { return {id, x, y, score} } )
        );
    }

    /**
     * Parcels sensend on the grid
     */
    emitParcelSensing () {
        // var parcels = [];
        // for ( const tile of this.#grid.getTiles( [this.x-5, this.x+5, this.y-5, this.y+5] ) ) {
        //     let {x, y} = tile;
        //     if ( tile.distance(this) < 5 ) {
        //         for ( let parcel of tile.parcels ) {
        //             let {id, reward} = parcel;
        //             parcels.push( {id, x, y, reward} )
        //         }
        //     }
        // }
        // this.emit( 'parcels sensing', parcels )
        
        this.emitOnePerTick( 'parcels sensing',
            Array.from( this.#grid.getParcels() ).filter( p => Xy.distance(p, this) < 5 ).map( p => {
                return {
                    id: p.id,
                    x: p.x,
                    y: p.y,
                    carriedBy: ( p.carriedBy ? p.carriedBy.id : null ),
                    reward: p.reward
                };
            } )
        );
    }

    get tile() {
        return this.#grid.getTile( Math.round(this.x), Math.round(this.y) );
    }

    async stepByStep ( incr_x, incr_y ) {
        var init_x = this.x
        var init_y = this.y
        this.x = ( this.x * 10 + incr_x*6 ) / 10; // this keep it rounded at .1
        this.y = ( this.y * 10 + incr_y*6 ) / 10; // this keep it rounded at .1
        for(let i=0; i<10; i++) {
            await new Promise( res => setTimeout(res, MOVEMENT_DURATION / 10))
            // this.x = ( this.x * 10 + incr_x ) / 10; // this keep it rounded at .1
            // this.y = ( this.y * 10 + incr_y ) / 10; // this keep it rounded at .1
            // console.log("moving into ", (init_x * 10 + incr_x * i ) / 10, this.y)
        }
        this.x = init_x + incr_x
        this.y = init_y + incr_y
    }

    moving = false;
    async move ( incr_x, incr_y ) {
        if ( this.moving ) // incr_x%1!=0 || incr_y%1!=0 ) // if still moving
            return false;
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
            return true;
        }
        // console.log(this.id, 'fail move in', this.x+incr_x, this.y+incr_y)
        return false;
    }

    up () {
        // console.log(this.id + ' move up')
        return this.move(0, 1);
    }

    down () {
        // console.log(this.id + ' move down')
        return this.move(0, -1);
    }

    left () {
        // console.log(this.id + ' move left')
        return this.move(-1, 0);
    }

    right () {
        // console.log(this.id + ' move right')
        return this.move(1, 0);
    }

    /**
     * @type {function(): void}
     */
    pickUp () {
        const picked = new Array();
        var counter = 0;
        for ( const /**@type {Parcel} parcel*/ parcel of this.#grid.getParcels() ) {
            if ( parcel.x == this.x && parcel.y == this.y && parcel.carriedBy == null ) {
                this.#carryingParcels.add(parcel);
                parcel.carriedBy = this;
                // parcel.x = 0;
                // parcel.y = 0;
                picked.push(parcel);
                counter++;
            }
        }
        console.log(this.id, 'pickUp', counter, 'parcels')
        if ( picked.length > 0 )
            this.emit( 'pickup', this, picked );
        return picked; // Array.from(this.#carryingParcels);
    }

    /**
     * @type {function(): void}
     */
    putDown () {
        var tile = this.tile
        var sc = 0;
        var dropped = new Array();
        for ( const parcel of this.#carryingParcels ) {
            this.#carryingParcels.delete(parcel);
            parcel.carriedBy = null;
            // parcel.x = this.x;
            // parcel.y = this.y;
            dropped.push(parcel);
            if ( tile.delivery ) {
                sc += parcel.reward;
                this.#grid.deleteParcel( parcel.id );
            }
        }
        console.log(this.id, 'putDown parcels for a total of', sc, 'pti')
        if ( dropped.length > 0 )
            this.emitOnePerTick( 'putdown', this, dropped );
        this.score += sc;
        return dropped;
    }
}



module.exports = Agent;