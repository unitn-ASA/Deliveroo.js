const ObservableValue = require('../reactivity/ObservableValue');
const Xy =  require('./Xy')
const Grid =  require('./Grid')
const Tile =  require('./Tile');
const Parcel =  require('./Parcel');
const myClock = require('./Clock');
const ObservableMulti = require('../reactivity/ObservableMulti');
const Sensor = require('./Sensor');
const Identity = require('./Identity');



/**
 * @class Agent
 * @extends { ObservableMulti< {xy:Xy, score:number, penalty:number, carryingParcels:Set<Parcel>} > }
 */
class Agent extends ObservableMulti {
    
    /** @type {Grid} #grid */
    #grid;
    /** @property {Grid} */
    get grid () { return this.#grid }

    /** @type {Identity} */
    #identity;
    /** @property {Identity} */
    get identity () { return this.#identity }

    /** @type {string} id */
    get id () { return this.#identity.id }
    
    /** @type {string} name */
    get name () { return this.#identity.name }
    
    /** @type {string} teamId */
    get teamId () { return this.#identity.teamId }

    /** @type {string} teamName */
    get teamName () { return this.#identity.teamName }
    
    /** @type {Xy} */
    xy;
    /** @type {number} */
    get x () { return this.xy?.x }
    /** @type {number} */
    get y () { return this.xy?.y }
    
    /** @type {Number} score */
    score;

    /** @type {Number} */
    penalty = 0;
    
    /** @type {Set<Parcel>} #carryingParcels */
    carryingParcels = new Set();

    config = {};

    /** @type {Sensor} sensor */
    #sensor;
    /** @property {Sensor} sensor */
    get sensor () { return this.#sensor; }



    /**
     * @constructor Agent
     * @param {Grid} grid
     * @param {Identity} identity
     */
    constructor ( grid, identity ) {

        super();

        this.watch('xy', true); // immediate=true to emit agent when spawning
        
        this.watch('score', true); // immediate=true to emit agent when spawning

        this.watch('penalty', true); // immediate=true to emit agent when spawning

        this.watch('carryingParcels', true); // immediate=true to emit agent when spawning
        
        let tiles_unlocked =
            Array.from( grid.getTiles() )
            // walkable
            .filter( t => t.walkable )
            // not locked
            .filter( t => ! t.locked )

        if ( tiles_unlocked.length == 0 )
            throw new Error('No unlocked tiles available on the grid')
        else {
            let tile = tiles_unlocked.at( Math.floor( Math.random() * tiles_unlocked.length - 1 ) )
            tile.lock();
            this.xy = tile.xy;
        }

        Object.assign( this.config, require('../../config') );
        
        Object.defineProperty (this, 'carrying', {
            get: () => Array.from(this.carryingParcels).map( ({id, reward}) => { return {id, reward}; } ), // Recursion on carriedBy->agent->carrying->carriedBy ... 
            enumerable: false
        });

        this.#sensor = new Sensor( grid, this );

        // Group 'xy', 'score' => into 'agent' event
        // this.onTick( 'xy', this.emitOnePerTick.bind(this, 'agent') );
        // this.onTick( 'score', this.emitOnePerTick.bind(this, 'agent') );

        this.#grid = grid;
        this.#identity = identity;
        this.score = 0;
        
        // Wrapping emitParcelSensing so to fire it just once every Node.js loop iteration
        // this.emitParcelSensing = new Postponer( this.emitParcelSensing.bind(this) ).at( myClock.synch() );

    }



    get tile() {
        if ( this.xy )
            return this.#grid.getTile( this.xy.rounded );
        return null;
    }

    async stepByStep ( incr_x, incr_y ) {
        var init_x = this.x
        var init_y = this.y
        if ( this.config.MOVEMENT_STEPS ) {
            // Immediate offset by 0.6*step
            this.xy = new Xy ( {
                x: ( 100 * this.x + 100 * incr_x / this.config.MOVEMENT_STEPS * 12/20 ) / 100,
                y: ( 100 * this.y + 100 * incr_y / this.config.MOVEMENT_STEPS * 12/20 ) / 100
            } )
        }
        for ( let i = 0; i < this.config.MOVEMENT_STEPS; i++ ) {
            // Wait for next step timeout = this.config.MOVEMENT_DURATION / MOVEMENT_STEPS
            // await new Promise( res => setTimeout(res, this.config.MOVEMENT_DURATION / MOVEMENT_STEPS ) )
            await myClock.synch( this.config.MOVEMENT_DURATION / this.config.MOVEMENT_STEPS );
            if ( i < this.config.MOVEMENT_STEPS - 1 ) {
                // Move by one step = 1 / MOVEMENT_STEPS
                this.xy = new Xy({
                    x: ( 100 * this.x + 100 * incr_x / this.config.MOVEMENT_STEPS ) / 100,
                    y: ( 100 * this.y + 100 * incr_y / this.config.MOVEMENT_STEPS ) / 100
                });
            }
        }
        // Finally at exact destination
        this.xy = new Xy( {
            x: init_x + incr_x,
            y: init_y + incr_y
        } );
    }

    doing = false;
    async exclusivelyDo ( actionFn ) {
        // if still doing
        if ( this.doing ) {
            this.penalty -= this.config.PENALTY;
            return false;
        }
        else {
            this.doing = true;
            await myClock.synch();
            let outcome = await actionFn();
            this.doing = false;
            return outcome;
        }
    }

    async move ( incr_x, incr_y ) {
        let fromTile = this.tile;
        if (!fromTile)
            return false;
        let toTile = this.#grid.getTile( { x: this.x + incr_x, y: this.y + incr_y } );
        if ( toTile && toTile.walkable && ! toTile.locked ) {
            toTile.lock();
            // console.log(this.id, 'start move in', this.x+incr_x, this.y+incr_y)
            await this.stepByStep( incr_x, incr_y );
            // console.log(this.id, 'done move in', this.x, this.y)
            fromTile.unlock();
            // this.emitParcelSensing(); // NO! this is done outside
            return this.xy;
        }
        // console.log(this.id, 'fail move in', this.x+incr_x, this.y+incr_y)
        this.penalty -= this.config.PENALTY;
        return false;
    }

    async up () {
        // console.log(this.id + ' move up')
        return this.exclusivelyDo( () => this.move(0, 1) );
    }

    async down () {
        // console.log(this.id + ' move down')
        return this.exclusivelyDo( () => this.move(0, -1) );
    }

    async left () {
        // console.log(this.id + ' move left')
        return this.exclusivelyDo( () => this.move(-1, 0) );
    }

    async right () {
        // console.log(this.id + ' move right')
        return this.exclusivelyDo( () => this.move(1, 0) );
    }

    /**
     * Pick up all parcels in the agent tile.
     * @function pickUp
     * @returns {Promise<Parcel[]>} An array of parcels that have been picked up
     */
    async pickUp () {
        let exclusivelyDoResult = await this.exclusivelyDo( () => {
            // return [];
            const picked = new Array();
            var counter = 0;
            for ( const /**@type {Parcel} parcel*/ parcel of this.#grid.getParcels() ) {
                if ( parcel.x == this.x && parcel.y == this.y && parcel.carriedBy == null ) {
                    this.carryingParcels.add(parcel);
                    parcel.carriedBy = this;
                    picked.push( parcel );
                    counter++;
                }
            }
            // console.log(this.id, 'pickUp', counter, 'parcels')
            return picked; // Array.from(this.#carryingParcels);

        } );
        return exclusivelyDoResult || [];
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
        let exclusivelyDoResult = await this.exclusivelyDo( () => {
            var tile = this.tile
            var sc = 0;
            var dropped = new Array();
            var toPutDown = Array.from( this.carryingParcels.values() );    // put down all parcels
            if ( ids && ids.length && ids.length > 0 )              // put down specified parcels
                toPutDown = toPutDown.filter( p => ids.includes( p.id ) );
            for ( const parcel of this.carryingParcels ) {
                this.carryingParcels.delete(parcel);
                parcel.carriedBy = null;
                // parcel.x = this.x;
                // parcel.y = this.y;
                dropped.push( parcel );
                if ( tile?.delivery ) {
                    sc += parcel.reward;
                    this.#grid.deleteParcel( parcel.id );
                }
            }
            this.score += sc;
            if ( sc > 0 ) {
                console.log( `${this.name}(${this.id}) putDown ${dropped.length} parcels (+ ${sc} pti -> ${this.score} pti)` );
                console.log( Array.from(this.#grid.agents.values()).map(({name,id,score})=>`${name}(${id}) ${score} pti`).join(', ') );
            }
            // if ( dropped.length > 0 )
            //     this.emitOnePerTick( 'putdown', this, dropped );
            return dropped;
        } );
        return exclusivelyDoResult || [];
    }
}



module.exports = Agent;