import Xy from './Xy.js';
import Grid from './Grid.js';
import Agent from './Agent.js';
import Parcel from './Parcel.js';
import Crate from './Crate.js';
import myClock from '../myClock.js';
import { config } from '../config/config.js';
import eventEmitter from 'events';
import { watchProperty } from '../reactivity/watchProperty.js';

/** @typedef {import("@unitn-asa/deliveroo-js-sdk/types/IOSensing.js").IOSensing} IOSensing */
/** @typedef {import("@unitn-asa/deliveroo-js-sdk/types/IOTile.js").IOTile} IOTile */
/** @typedef {import("@unitn-asa/deliveroo-js-sdk/types/IOAgent.js").IOAgent} IOAgent */
/** @typedef {import("@unitn-asa/deliveroo-js-sdk/types/IOParcel.js").IOParcel} IOParcel */
/** @typedef {import("@unitn-asa/deliveroo-js-sdk/types/IOCrate.js").IOCrate} IOCrate */
/** @typedef {import("@unitn-asa/deliveroo-js-sdk/types/IOEntity.js").IOEntity} IOEntity */



/**
 * @class Sensor
 */
class Sensor {

    /**
     * @typedef {{ sensing: IOSensing[] }} EventsMap
     * @type { eventEmitter<EventsMap> }
    */
    #emitter = new eventEmitter();
    get emitter () { return this.#emitter; }

    /** @type {Grid} #grid */
    #grid;

    /** @type {Agent} id */
    #me;

    /** @type {IOSensing} */
    sensing;

    /** @type {boolean} */
    #sensingDirty = true;

    /** @type {boolean} */
    #sensingEnabled = false;

    #agentListener = ({ object: who }) => {
        if (!who) return;
        // On my movements emit sensing
        if ( this.#me.id == who.id ) {
            this.#sensingDirty = true;
        }
        // On whoever moves is my position is undefined, emit sensing as I can see everything
        else if ( this.#me.x == undefined || this.#me.y == undefined ) {
            this.#sensingDirty = true;
        }
        // On others movements within my range (+1  to include agents moving out of my sensing area), emit sensing
        else if ( Xy.distance(this.#me, who) <= (config.GAME.player.observation_distance + 1) ) {
            this.#sensingDirty = true;
        }
    };

    /** Marks local sensing dirty for self-only state not emitted by Grid. */
    #selfStateChangedListener = () => {
        this.#sensingDirty = true;
    };

    #parcelListener = ({ object: parcel }) => {
        if (!parcel) return;
        if ( !( Xy.distance(this.#me, parcel) > config.GAME.player.observation_distance ) ) {
            this.#sensingDirty = true;
        }
    };

    #crateListener = ({ object: crate }) => {
        if (!crate) return;
        if ( !( Xy.distance(this.#me, crate) > config.GAME.player.observation_distance ) ) {
            this.#sensingDirty = true;
        }
    };

    /** @param {{layer: any, object: any, type: string}} event */
    #layerChangeListener = ( { object } ) => {
        if ( !object ) {
            // Layer registered/unregistered: recompute to pick up or drop its entities
            this.#sensingDirty = true;
            return;
        }
        if ( !( Xy.distance(this.#me, object) > config.GAME.player.observation_distance ) ) {
            this.#sensingDirty = true;
        }
    };

    /**
     * @constructor Agent
     * @param {Grid} grid
     * @param {Agent} me
     */
    constructor ( grid, me ) {

        this.#emitter.setMaxListeners(0); // unlimited listeners

        watchProperty({
            target: this,
            key: 'sensing',
            callback: (target, key, value) => target.#emitter.emit(key, value)
        });

        this.#grid = grid;

        this.#me = me;

        // On each frame
        myClock.on('frame', () => {
            // if dirty
            if (this.#sensingDirty) {
                // start time
                // const start = performance.now();
                // compute sensing, therefore emit sensing event
                this.computeSensing();
                // end time
                // const end = performance.now();
                // console.log(`Sensor.js ${me.name} at frame#${myClock.frame} computeSensing took ${end - start} ms`);
            }
        });

        // Cleanup listeners on agent deleted
        me.emitter?.once( 'deleted', () => {
            this.turnOff();
        });

    }

    /**
     * Turn on sensing by subscribing to grid events and computing sensing on each frame if dirty
     */
    turnOn () {
        const grid = this.#grid;
        const me = this.#me;

        if (! this.#sensingEnabled) {
            // Set sensing enabled
            this.#sensingEnabled = true;
            
            // On myself or other agents changes
            grid.agents.onChanged(this.#agentListener);
            me.emitter.on('penalty', this.#selfStateChangedListener);
            me.emitter.on('rotation', this.#selfStateChangedListener);
            me.emitter.on('carryingParcels', this.#selfStateChangedListener);

            // On parcel changes
            grid.parcels.onChanged(this.#parcelListener);

            // On crate changes
            grid.crates.onChanged(this.#crateListener);

            // On plugin-owned entity layer changes
            grid.onEntityLayerChanged(this.#layerChangeListener);
            grid.emitter.on('mapLoaded', this.#selfStateChangedListener);

        }

    }

    /**
     * Turn off sensing by unsubscribing from grid events and cleaning up listeners
     */
    turnOff () {
        const grid = this.#grid;
        const me = this.#me;

        // Set sensing disabled
        this.#sensingEnabled = false;
        
        // Cleanup listeners
        grid.agents.offChanged(this.#agentListener);
        me.emitter.off('penalty', this.#selfStateChangedListener);
        me.emitter.off('rotation', this.#selfStateChangedListener);
        me.emitter.off('carryingParcels', this.#selfStateChangedListener);
        grid.parcels.offChanged(this.#parcelListener);
        grid.crates.offChanged(this.#crateListener);
        grid.offEntityLayerChanged(this.#layerChangeListener);
        grid.emitter.off('mapLoaded', this.#selfStateChangedListener);
        this.emitter.removeAllListeners();
    }



    /**
     * Compute current sensing from the Grid using BFS for O(k) performance
     * where k = visible tiles instead of O(n) where n = all tiles
     * @type {function(): void}
     */
    computeSensing () {

        // dirty flag is reset at the beginning of the sensing computation, so that if any change happens during the computation, it will be marked as dirty again and re-computed in the next frame
        this.#sensingDirty = false;

        /** @type {Array<{x:number, y:number}>} */
        const positions = [];

        /** @type {Array<IOAgent>} */
        const agents = [];
        /** @param {Agent} a */
        function pushAgent (a) {
            agents.push( {
                id: a.id,
                name: a.name,
                teamId: a.teamId,
                teamName: a.teamName,
                x: a.x,
                y: a.y,
                score: a.score,
                penalty: a.penalty,
                rotation: a.rotation,
                attributes: a.attributes.toArray()
            } );
        }

        /** @type {Array<IOParcel>} */
        const parcels = [];
        /** @param {Parcel} p */
        function pushParcel (p) {
            parcels.push( {
                id: p.id,
                x: p.x,
                y: p.y,
                carriedBy: p.carriedBy ? p.carriedBy.id : null,
                reward: p.reward
            } );
        };

        /** @type {Array<IOCrate>} */
        const crates = [];
        /** @param {Crate} c */
        function pushCrate (c) {
            crates.push( {
                id: c.id,
                x: c.x,
                y: c.y
            } );
        };

        // Plugin-owned entities, filtered by the perceived positions.
        /** @type {Array<IOEntity>} */
        const entities = [];
        const collectLayers = ( visible ) => {
            for ( const layer of this.#grid.getEntityLayers() ) {
                for ( const entity of layer.getIterator() ) {
                    if ( visible && ! visible.has( `${entity.x},${entity.y}` ) ) continue;
                    entities.push( entity.toIO() );
                }
            }
        };

        // The sensing agent itself, with its plugin-owned attributes
        const buildSelf = () => ( {
            id: this.#me.id,
            name: this.#me.name,
            teamId: this.#me.teamId,
            teamName: this.#me.teamName,
            x: this.#me.x,
            y: this.#me.y,
            score: this.#me.score,
            penalty: this.#me.penalty,
            rotation: this.#me.rotation ?? null,
            attributes: this.#me.attributes.toArray()
        } );

        // if my position is undefined OR if unlimited observation_distance (-1), sense everything
        if ( this.#me.x == undefined || this.#me.y == undefined || config.GAME.player.observation_distance == -1 ) {
            // All tiles
            for ( let tile of this.#grid.tiles.getIterator() ) {
                positions.push( {x: tile.x, y: tile.y} );
            }
            // All agents except myself
            for ( let a of this.#grid.agents.getIterator() ) {
                if ( a && a != this.#me ) {
                    pushAgent( a );
                }
            }
            // All parcels
            for ( let p of this.#grid.parcels.getIterator() ) {
                pushParcel( p );
            }
            // All crates
            for ( let c of this.#grid.crates.getIterator() ) {
                pushCrate( c );
            }
            // All layer objects, unfiltered
            collectLayers( null );
            this.sensing = { frame: myClock.frame, positions, agents, parcels, crates, entities, self: buildSelf() };
            return;
        }

        // BFS to find visible tiles using Manhattan distance
        const visited = new Set(); // Stores "x,y" keys
        const queue = [{ x: Math.round(this.#me.x), y: Math.round(this.#me.y), dist: 0 }];
        const dx = [0, 1, 0, -1];
        const dy = [1, 0, -1, 0];

        // Border optimization: Store border positions to check for agents/crates moving out of visible area
        const borderQueue = [];

        while (queue.length > 0) {
            const { x, y, dist } = queue.shift();
            const key = `${x},${y}`;

            if (visited.has(key)) continue;
            visited.add(key);

            // Get tile at this position
            const tile = this.#grid.tiles.getOneByXy({ x, y });
            if (!tile) continue;

            positions.push({ x, y });

            // Collect parcels at this position (using spatial registry)
            for (let p of this.#grid.parcels.getByXy({ x, y })) {
                pushParcel( p );
            }

            // Collect agents at this position (using spatial registry)
            for (let a of this.#grid.agents.getByXy({ x, y })) {
                if (a !== this.#me) {
                    pushAgent( a );
                }
            }

            // Collect crates at this position (using spatial registry)
            for (let c of this.#grid.crates.getByXy({ x, y })) {
                pushCrate( c );
            }

            // Add neighbors if within distance
            if (dist < config.GAME.player.observation_distance) {
                for (let i = 0; i < 4; i++) {
                    const nx = x + dx[i];
                    const ny = y + dy[i];
                    const nkey = `${nx},${ny}`;
                    if (!visited.has(nkey)) {
                        queue.push({ x: nx, y: ny, dist: dist + 1 });
                    }
                }
            } else {
                // Border optimization: Add neighbors at distance +1 to capture entities moving out of visible area
                for (let i = 0; i < 4; i++) {
                    const nx = x + dx[i];
                    const ny = y + dy[i];
                    const nkey = `${nx},${ny}`;
                    if (!visited.has(nkey)) {
                        visited.add(nkey); // Mark as visited to avoid re-adding
                        borderQueue.push({ x: nx, y: ny });
                    }
                }
            }
        }

        // Border optimization: Store border positions to check for agents/crates moving out of visible area
        // This captures entities moving out of visible area (distance < observation_distance + 1)
        for (const pos of borderQueue) {
            // Check for agents at border positions
            // Agents can have fractional positions, so verify actual distance
            for (let a of this.#grid.agents.getByXy(pos)) {
                if (a !== this.#me && !agents.find(ag => ag.id === a.id)) {
                    const dist = Xy.distance(a, this.#me);
                    if (dist < config.GAME.player.observation_distance + 1) {
                        pushAgent( a );
                    }
                }
            }
        }

        // console.log(`Sensor.js ${this.#agent.id} sensing an area of ${positions.length} tiles with: ${agents.length} agents, ${parcels.length} parcels, ${crates.length} crates`);

        // Only layer objects laying on perceived positions are sensed
        const visible = new Set( positions.map( p => `${p.x},${p.y}` ) );
        collectLayers( visible );

        this.sensing = { frame: myClock.frame, positions, agents, parcels, crates, entities, self: buildSelf() };

    }

}


export default Sensor;
