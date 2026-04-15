import { config } from '../config/config.js';
import Xy from './Xy.js';
import Grid from './Grid.js';
import Tile from './Tile.js';
import Parcel from './Parcel.js';
import myClock from '../myClock.js';
import Sensor from './Sensor.js';
import Controller from './Controller.js';
import Identity from './Identity.js';
import eventEmitter from 'events';
import { watchProperty } from '../reactivity/watchProperty.js';
import { atNextTick } from '../reactivity/postponeAt.js';
import { ActionMutex } from '../utils/ActionMutex.js';


/** @typedef {import('@unitn-asa/deliveroo-js-sdk/types/IOAgent.js').IOAgent} IOAgent */

/**
 * @typedef {{xy: [Xy], score: [number], penalty: [number], carryingParcels: [Set<Parcel>], deleted: [Agent]}} AgentEventsMap
*/



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
    /** @type {Tile} */
    get tile() {
        if ( this.xy )
            return this.#grid.tileRegistry.getOneByXy( this.xy.rounded );
        return null;
    }
    
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

    /** @type {Controller} controller */
    #controller;
    /** @property {Controller} controller */
    get controller () { return this.#controller; }
       
    // Create action mutex to prevent concurrent actions
    /** @type { function( function():Promise ) : Promise } */
    /** @type {ActionMutex} */
    #actionMutex;
    get actionMutex () { return this.#actionMutex; }



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

        // let tiles_unlocked =
        //     Array.from( grid.tileRegistry.getIterator() )
        //     // walkable
        //     .filter( t => t.walkable )
        //     // not locked
        //     .filter( t => ! t.locked )

        // if ( tiles_unlocked.length == 0 ) {
        //     console.warn('No unlocked tiles available on the grid. Spawning agent on the first tile (probably locked).');
        //     this.xy = grid.tileRegistry.getIterator().next().value.xy;
        // }
        // else {
        //     let tile = tiles_unlocked.at( Math.floor( Math.random() * tiles_unlocked.length - 0.001 ) )
        //     tile.lock();
        //     this.xy = tile.xy;
        // }
        
        Object.defineProperty (this, 'carrying', {
            get: () => Array.from(this.carryingParcels).map( ({id, reward}) => { return {id, reward}; } ), // Recursion on carriedBy->agent->carrying->carriedBy ... 
            enumerable: false
        });

        this.#sensor = new Sensor( grid, this );

        this.#controller = new Controller( grid, this );

        // Group 'xy', 'score' => into 'agent' event
        // this.onTick( 'xy', this.emitOnePerTick.bind(this, 'agent') );
        // this.onTick( 'score', this.emitOnePerTick.bind(this, 'agent') );

        this.#grid = grid;
        this.#identity = identity;
        this.score = 0;

        // Create exclusive action wrapper (isDoing is managed internally via WeakMap)
        this.#actionMutex = new ActionMutex(myClock, {
            onConflict: () => {
                this.penalty -= config.PENALTY;
                console.warn(`${this.name}(${this.id}) got penalty ${this.penalty}: trying to do something without waiting for previous action to finish!`);
            }
        });

    }

    /**
     * Deletes the agent, emitting a 'deleted' event and cleaning up listeners.
     * Also handles unlocking tiles and putting down parcels to ensure proper cleanup.
     */
    async delete () {

        await this.actionMutex.waitIdle();

        if ( this.tile )
            this.tile.unlock();

        // if ( agent.xy?.roundedFrom )
        //     this.tileRegistry.getOneByXy(agent.xy.roundedFrom).unlock();

        // Put down all parcels if carrying any, to handle score updates
        await this.#controller.putDown();
        
        // Clear position to prevent further interactions
        this.xy = undefined;

        // Emit deleted event before removing all listeners, automatically removes from spatial registry
        // Automatically cleanup sensor listeners to prevent memory leak
        this.emitter.emit( 'deleted', this );

        // Unsubscribe all event listeners
        this.emitter.removeAllListeners();

    }

}



export default Agent;
