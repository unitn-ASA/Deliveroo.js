console.log('Agent.js loaded');

import { config } from '../config/config.js';
import Xy from './Xy.js';
import Grid from './Grid.js';
import Tile from './Tile.js';
import Parcel from './Parcel.js';
import myClock from '../myClock.js';
import Sensor from './Sensor.js';
import Identity from './Identity.js';
import eventEmitter from 'events';
import { watchProperty } from '../reactivity/watchProperty.js';
import { atNextTick } from '../reactivity/postponeAt.js';


/** @typedef {import('@unitn-asa/deliveroo-js-sdk/types/IOAgent.js').IOAgent} IOAgent */

/**
 * @typedef {{xy: [Xy], score: [number], penalty: [number], carryingParcels: [Set<Parcel>], deleted: [Agent]}} AgentEventsMap
*/


const MOVEMENT_STEPS = 1;



/**
 * @class Agent
 * @implements {IOAgent}
*/
class Agent {
    
    /**
     * @type { eventEmitter<AgentEventsMap> }
    */
   #emitter = new eventEmitter();
   get emitter () { return this.#emitter; }
    
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

        this.#emitter.setMaxListeners(0); // unlimited listeners
        
        watchProperty({
            target: this,
            key: 'xy',
            // callback: (target, key, value) => { this.#emitter.emit('xy', value); }
            callback: atNextTick( (target, key, value) => target.#emitter.emit(key, value) )
        });
        // this.#emitter.emit('xy', this.xy) // to immediately emit agent when spawning
        
        watchProperty({
            target: this,
            key: 'score',
            callback: atNextTick( (target, key, value) => this.#emitter.emit('score', value) )
        });
        // this.#emitter.emit('score', this.score) // to immediately emit agent when spawning

        watchProperty({
            target: this,
            key: 'penalty',
            callback: atNextTick( (target, key, value) => this.#emitter.emit('penalty', value) )
        });
        // this.#emitter.emit('penalty', this.penalty) // to immediately emit agent when spawning

        watchProperty({
            target: this,
            key: 'carryingParcels',
            callback: atNextTick( (target, key, value) => this.#emitter.emit('carryingParcels', value) )
        });
        // this.#emitter.emit('carryingParcels', this.carryingParcels) // to immediately emit agent when spawning

        let tiles_unlocked =
            Array.from( grid.tileRegistry.getIterator() )
            // walkable
            .filter( t => t.walkable )
            // not locked
            .filter( t => ! t.locked )

        if ( tiles_unlocked.length == 0 ) {
            console.warn('No unlocked tiles available on the grid. Spawning agent on the first tile (probably locked).');
            this.xy = grid.tileRegistry.getIterator().next().value.xy;
        }
        else {
            let tile = tiles_unlocked.at( Math.floor( Math.random() * tiles_unlocked.length - 0.001 ) )
            tile.lock();
            this.xy = tile.xy;
        }
        
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
        
    }



    get tile() {
        if ( this.xy )
            return this.#grid.tileRegistry.getOneByXy( this.xy.rounded );
        return null;
    }

    async stepByStep ( incr_x, incr_y ) {
        var init_x = this.x
        var init_y = this.y
        if ( MOVEMENT_STEPS ) {
            // Immediate offset by 0.6*step
            this.xy = new Xy ( {
                x: ( 100 * this.x + 100 * incr_x / MOVEMENT_STEPS * 12/20 ) / 100,
                y: ( 100 * this.y + 100 * incr_y / MOVEMENT_STEPS * 12/20 ) / 100
            } )
        }
        for ( let i = 0; i < MOVEMENT_STEPS; i++ ) {
            // Wait for next step timeout = this.config.player.movement_duration / MOVEMENT_STEPS
            // await new Promise( res => setTimeout(res, this.config.player.movement_duration / MOVEMENT_STEPS ) )
            await myClock.synch( config.GAME.player.movement_duration / MOVEMENT_STEPS );
            if ( i < MOVEMENT_STEPS - 1 ) {
                // Move by one step = 1 / MOVEMENT_STEPS
                this.xy = new Xy({
                    x: ( 100 * this.x + 100 * incr_x / MOVEMENT_STEPS ) / 100,
                    y: ( 100 * this.y + 100 * incr_y / MOVEMENT_STEPS ) / 100
                });
            }
        }
        // Finally at exact destination
        this.xy = new Xy( {
            x: init_x + incr_x,
            y: init_y + incr_y
        } );
    }

    /** @type {Promise} */
    doing;
    /** @type {boolean} */
    isDoing = false;
    /** @type {function(function):Promise}*/
    async exclusivelyDo ( actionFn ) {
        // if still pending
        if ( this.isDoing ) {
            this.penalty -= config.PENALTY;
            console.warn( `${this.name}(${this.id}) got penalty ${this.penalty}: trying to do something without waiting for previous action to finish!` );
            return false;
        }
        else {
            this.doing = (async () => {
                this.isDoing = true;
                await myClock.synch();
                let outcome = await actionFn();
                this.isDoing = false;
                return outcome;
            }) ();
            return this.doing;
        }
    }

    async move ( incr_x, incr_y ) {
        let fromTile = this.tile;
        if (!fromTile)
            return false;
        let toTile = this.#grid.tileRegistry.getOneByXy( { x: this.x + incr_x, y: this.y + incr_y } );

        // Check if current tile is directional and blocks exit in this direction
        if (fromTile.isDirectional && !fromTile.allowsExitInDirection(incr_x, incr_y)) {
            this.penalty -= config.PENALTY;
            // console.warn( `${this.name}(${this.id}) blocked by directional tile: cannot exit ${fromTile.type} tile in this direction` );
            return false;
        }

        // Check if destination tile is directional and blocks entry from current position
        if (toTile && toTile.isDirectional && !toTile.allowsMovementFrom(this.x, this.y)) {
            this.penalty -= config.PENALTY;
            // console.warn( `${this.name}(${this.id}) blocked by directional tile: cannot enter ${toTile.type} tile from this direction` );
            return false;
        }

        // Check if there's a crate on the destination tile and try to push it
        const cratesOnTile = this.#grid.crateRegistry.getByXy( { x: this.x + incr_x, y: this.y + incr_y } );
        if (cratesOnTile.length > 0) {
            const crate = cratesOnTile[0];
            const crateDestTile = this.#grid.tileRegistry.getOneByXy( { x: this.x + incr_x * 2, y: this.y + incr_y * 2 } );

            // Check if the crate can be pushed to the destination tile
            // Must be type "5", unlocked, and not blocked by other entities
            if (!crateDestTile || !crateDestTile.type.startsWith("5") || crateDestTile.locked) {
                // Cannot push crate, movement fails
                this.penalty -= config.PENALTY;
                // console.warn( `${this.name}(${this.id}) blocked by crate: cannot push to destination (not type 5 or locked)` );
                return false;
            }

            // Check if destination tile has any crates
            const crateAtDest = this.#grid.crateRegistry.getOneByXy( new Xy( { x: this.x + incr_x * 2, y: this.y + incr_y * 2 } ) );
            if (crateAtDest) {
                // Cannot push crate onto another crate
                this.penalty -= config.PENALTY;
                // console.warn( `${this.name}(${this.id}) blocked by crate: destination has another crate` );
                return false;
            }

            // Check if destination tile has an agent
            const agentAtDest = this.#grid.agentRegistry.getOneByXy( new Xy( { x: this.x + incr_x * 2, y: this.y + incr_y * 2 } ) );
            if (agentAtDest) {
                // Cannot push crate onto an agent
                this.penalty -= config.PENALTY;
                // console.warn( `${this.name}(${this.id}) blocked by crate: destination has an agent` );
                return false;
            }

            // Push the crate
            crate.xy = new Xy( { x: this.x + incr_x * 2, y: this.y + incr_y * 2 } );
        }

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
        this.penalty -= config.PENALTY;
        // console.warn( `${this.name}(${this.id}) got penalty ${this.penalty}: move was not possible, tile either not existing, blocked or not walkable!` );
        return false;
    }

    async up () {
        // console.log(this.id + ' move up')
        return await this.exclusivelyDo( () => this.move(0, 1) );
    }

    async down () {
        // console.log(this.id + ' move down')
        return await this.exclusivelyDo( () => this.move(0, -1) );
    }

    async left () {
        // console.log(this.id + ' move left')
        return await this.exclusivelyDo( () => this.move(-1, 0) );
    }

    async right () {
        // console.log(this.id + ' move right')
        return await this.exclusivelyDo( () => this.move(1, 0) );
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
            // Use getParcelsAt instead of iterating through all parcels - O(1) lookup instead of O(parcels)
            for ( const /**@type {Parcel} parcel*/ parcel of this.#grid.parcelRegistry.getByXy( this.xy.rounded ) ) {
                if ( parcel.carriedBy == null ) {
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
                // Leaderboard
                // console.log( Array.from(this.#grid.agents.values()).map(({name,id,score})=>`${name}(${id}) ${score} pti`).join(', ') );
            }
            // if ( dropped.length > 0 )
            //     this.emitOnePerTick( 'putdown', this, dropped );
            return dropped;
        } );
        return exclusivelyDoResult || [];
    }
}



export default Agent;
