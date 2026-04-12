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

    /** @type {(who: Agent) => void} - Grid agent listener */
    #agentListener = ( who ) => {
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

    /** @type {(parcel: Parcel) => void} - Grid parcel listener */
    #parcelListener = ( parcel ) => {
        if ( !( Xy.distance(this.#me, parcel) > config.GAME.player.observation_distance ) ) {
            this.#sensingDirty = true;
        }
    };

    /** @type {(crate: Crate) => void} - Grid crate listener */
    #crateListener = ( crate ) => {
        if ( !( Xy.distance(this.#me, crate) > config.GAME.player.observation_distance ) ) {
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
            grid.emitter.onAgentXy( this.#agentListener );
            grid.emitter.onAgentDeleted( this.#agentListener );
            grid.emitter.onAgentScore( this.#agentListener );

            // On parcel changes
            grid.emitter.onParcel( this.#parcelListener );

            // On crate changes
            grid.emitter.onCrate( this.#crateListener );
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
        grid.emitter.offAgentXy( this.#agentListener );
        grid.emitter.offAgentDeleted( this.#agentListener );
        grid.emitter.offAgentScore( this.#agentListener );
        grid.emitter.offParcel( this.#parcelListener );
        grid.emitter.offCrate( this.#crateListener );
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
                penalty: a.penalty
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

        // if my position is undefined, sense everything
        if ( this.#me.x == undefined || this.#me.y == undefined ) {
            // All tiles
            for ( let tile of this.#grid.tileRegistry.getIterator() ) {
                positions.push( {x: tile.x, y: tile.y} );
            }
            // All agents except myself
            for ( let a of this.#grid.agentRegistry.getIterator() ) {
                if ( a && a != this.#me ) {
                    pushAgent( a );
                }
            }
            // All parcels
            for ( let p of this.#grid.parcelRegistry.getIterator() ) {
                pushParcel( p );
            }
            // All crates
            for ( let c of this.#grid.crateRegistry.getIterator() ) {
                pushCrate( c );
            }
            this.sensing = { positions, agents, parcels, crates };
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
            const tile = this.#grid.tileRegistry.getOneByXy({ x, y });
            if (!tile) continue;

            positions.push({ x, y });

            // Collect parcels at this position (using spatial registry)
            for (let p of this.#grid.parcelRegistry.getByXy({ x, y })) {
                pushParcel( p );
            }

            // Collect agents at this position (using spatial registry)
            for (let a of this.#grid.agentRegistry.getByXy({ x, y })) {
                if (a !== this.#me) {
                    pushAgent( a );
                }
            }

            // Collect crates at this position (using spatial registry)
            for (let c of this.#grid.crateRegistry.getByXy({ x, y })) {
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
            for (let a of this.#grid.agentRegistry.getByXy(pos)) {
                if (a !== this.#me && !agents.find(ag => ag.id === a.id)) {
                    const dist = Xy.distance(a, this.#me);
                    if (dist < config.GAME.player.observation_distance + 1) {
                        pushAgent( a );
                    }
                }
            }
        }

        // console.log(`Sensor.js ${this.#agent.id} sensing an area of ${positions.length} tiles with: ${agents.length} agents, ${parcels.length} parcels, ${crates.length} crates`);

        this.sensing = { positions, agents, parcels, crates };

    }



}


export default Sensor;
