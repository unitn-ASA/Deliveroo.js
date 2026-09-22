import { config } from '../config/config.js';
import Xy from './Xy.js';
import Grid from './Grid.js';
import Tile from './Tile.js';
import Parcel from './Parcel.js';
import myClock from '../myClock.js';
import Sensor from './Sensor.js';
import Identity from './Identity.js';
import { watchProperty } from '../reactivity/watchProperty.js';
import { atNextTick } from '../reactivity/postponeAt.js';
import { ActionMutex } from '../utils/ActionMutex.js';
import { CommandBus } from '../utils/CommandBus.js';
import { applyPutdown } from './parcelActions.js';
import SpatialObject from './SpatialObject.js';


/** @typedef {import('@unitn-asa/deliveroo-js-sdk/types/IOAgent.js').IOAgent} IOAgent */

/**
 * @typedef {Object} AgentComponent
 * @property {string} [id]
 * @property {(agent: Agent) => void} [start] - Registers commands on agent.commands
 * @property {(agent: Agent) => void} [stop] - Releases what start acquired
 */

/**
 * @typedef {{xy: [Xy], score: [number], penalty: [number], rotation: [number], carryingParcels: [Set<Parcel>], attributes: [any], deleted: [Agent]}} AgentEventsMap
*/



/**
 * @class Agent
 */
class Agent extends SpatialObject {
    
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
    
    /** @type {Tile} */
    get tile() {
        if ( this.xy )
            return this.#grid.tiles.getOneByXy( this.xy.rounded );
        return null;
    }
    
    /** @type {Number} score */
    score;

    /** @type {Number} */
    penalty = 0;

    /**
     * Facing direction: 0 = up (North), 1 = right (East), 2 = down (South),
     * 3 = left (West). Always defined (defaults to 0): the standard movement
     * autorotates it to the movement direction, rotation-based components
     * turn it explicitly.
     * @type {number}
     */
    rotation = 0;

    /** @type {Set<Parcel>} #carryingParcels */
    carryingParcels = new Set();

    /** @type {Sensor} sensor */
    #sensor;
    /** @property {Sensor} sensor */
    get sensor () { return this.#sensor; }

    // Create action mutex to prevent concurrent actions
    /** @type { function( function():Promise ) : Promise } */
    /** @type {ActionMutex} */
    #actionMutex;
    get actionMutex () { return this.#actionMutex; }

    /** @type {CommandBus} */
    #commands;
    get commands () { return this.#commands; }

    /** @type {Set<AgentComponent>} */
    #components = new Set();
    get components () { return this.#components; }



    /**
     * @constructor Agent
     * @param {Grid} grid
     * @param {Identity} identity
     * @param {{kind: string, value: number | string, max?: number}[]} [attributes] - Initial attributes, set before the layer 'added' event so plugins observe them
     */
    constructor ( grid, identity, attributes = [] ) {
        super({ attributes });
        // this.#emitter.emit('xy', this.xy) // to immediately emit agent when spawning
        
        watchProperty({
            target: this,
            key: 'score',
            callback: atNextTick((target, key, value) => {
                target.emitter.emit('score', value);
                target.emitter.emit('changed', { object: target, key });
            })
        });
        // this.#emitter.emit('score', this.score) // to immediately emit agent when spawning

        watchProperty({
            target: this,
            key: 'penalty',
            callback: atNextTick((target, key, value) => {
                target.emitter.emit('penalty', value);
                target.emitter.emit('changed', { object: target, key });
            })
        });
        // this.#emitter.emit('penalty', this.penalty) // to immediately emit agent when spawning

        watchProperty({
            target: this,
            key: 'rotation',
            callback: atNextTick((target, key, value) => {
                target.emitter.emit(key, value);
                target.emitter.emit('changed', { object: target, key });
            })
        });

        watchProperty({
            target: this,
            key: 'carryingParcels',
            callback: atNextTick((target, key, value) => {
                target.emitter.emit('carryingParcels', value);
                target.emitter.emit('changed', { object: target, key });
            })
        });
        // this.#emitter.emit('carryingParcels', this.carryingParcels) // to immediately emit agent when spawning

        
        Object.defineProperty (this, 'carrying', {
            get: () => Array.from(this.carryingParcels).map( ({id, reward}) => { return {id, reward}; } ), // Recursion on carriedBy->agent->carrying->carriedBy ... 
            enumerable: false
        });

        this.#grid = grid;
        this.#identity = identity;
        this.#sensor = new Sensor( grid, this );

        this.#commands = new CommandBus();

        // Group 'xy', 'score' => into 'agent' event
        // this.onTick( 'xy', this.emitOnePerTick.bind(this, 'agent') );
        // this.onTick( 'score', this.emitOnePerTick.bind(this, 'agent') );

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
     * Attach a per-agent component and let it register local commands.
     * @param {AgentComponent} component
     */
    attachComponent(component) {
        if (this.#components.has(component)) return component;
        component.start?.(this);
        this.#components.add(component);
        return component;
    }

    /**
     * Stop and remove a single attached component.
     * @param {AgentComponent} component
     * @returns {boolean}
     */
    detachComponent(component) {
        if (!this.#components.delete(component)) return false;
        component.stop?.(this);
        return true;
    }

    async stopComponents() {
        for (const component of this.#components) {
            await component.stop?.(this);
        }
        this.#components.clear();
    }

    /**
     * Deletes the agent, emitting a 'deleted' event and cleaning up listeners.
     * Also handles unlocking tiles and putting down parcels to ensure proper cleanup.
     */
    async delete () {

        await this.actionMutex.waitIdle();

        await this.stopComponents();

        if ( this.tile )
            this.tile.unlock();

        // Put down all parcels if carrying any, to handle score updates
        await applyPutdown(this);
        
        // Clear position to prevent further interactions
        this.xy = undefined;

        // Emit deleted event before removing all listeners, automatically removes from spatial registry
        // Automatically cleanup sensor listeners to prevent memory leak
        super.delete();

    }

}



export default Agent;
