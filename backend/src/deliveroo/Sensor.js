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

    /** @type {(event: any, who: Agent) => void} - Grid agent listener */
    #agentListener = ( event, who ) => {
        // On my movements emit agents, parcels and crates sensing
        if ( this.#me.id == who.id ) {
            this.#sensingDirty = true;
        }
        // On others movements within my range, emit agents sensing
        else if ( !( Xy.distance(this.#me, who) > config.GAME.player.observation_distance ) ) {
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

    /** @type {(event: any) => void} - Agent xy listener */
    #myXyListener = ( event ) => {
        this.#sensingDirty = true;
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

        if ( me ) {

            // On my changes emit agents, parcels and crates sensing,
            // on others changes within my range, emit agents sensing
            grid.emitter.onAgent( 'xy', this.#agentListener );
            grid.emitter.onAgent( 'deleted', this.#agentListener );
            grid.emitter.onAgent( 'score', this.#agentListener );

            // On parcel and my movements emit parcels sensing
            grid.emitter.onParcel( this.#parcelListener );

            // On crate and my movements emit crates sensing
            grid.emitter.onCrate( this.#crateListener );

            // On my movements emit parcels and crates sensing
            // agent.emitter?.on( 'xy', this.#myXyListener );

        }

        // Fire on each frame if dirty
        myClock.on('frame', () => {

            if (this.#sensingDirty) {
                this.computeSensing();
            }

        });

    }

    /**
     * Cleanup method to remove event listeners and prevent memory leaks
     */
    cleanup() {
        if ( this.#agentListener ) {
            this.#grid.emitter.offAgent( this.#agentListener );
        }
        if ( this.#parcelListener ) {
            this.#grid.emitter.offParcel( this.#parcelListener );
        }
        if ( this.#crateListener ) {
            this.#grid.emitter.offCrate( this.#crateListener );
        }
        if ( this.#myXyListener && this.#me ) {
            this.#me.emitter?.off( 'xy', this.#myXyListener );
        }
        this.emitter.removeAllListeners();
    }



    /**
     * Compute current sensing from the Grid
     * @type {function(): void}
     */
    computeSensing () {

        // dirty flag is reset at the beginning of the sensing computation, so that if any change happens during the computation, it will be marked as dirty again and re-computed in the next frame
        this.#sensingDirty = false;

        /** @type {Array<{x:number, y:number}>} */
        const positions = [];

        /** @type {Array<IOAgent>} */
        const agents = [];

        /** @type {Array<IOParcel>} */
        const parcels = [];

        /** @type {Array<IOCrate>} */
        const crates = [];

        // for each tile on the grid
        for ( let tile of this.#grid.tileRegistry.getIterator() ) {
            // only if my position is undefined OR if within observation distance
            if ( ( this.#me.x == undefined && this.#me.y == undefined ) || Xy.distance(tile, this.#me) < config.GAME.player.observation_distance ) {
                positions.push( {x: tile.x, y: tile.y} );
            }
        }

        // for each observed tile, check if an agent is sensed on it
        for ( let xy of positions ) {
            // agent sensed on this tile, assume at most one agent per tile
            const sensedAgent = this.#grid.agentRegistry.getByXy( xy )[0];
            // if defined and not myself
            if ( sensedAgent && sensedAgent != this.#me ) {
                agents.push( {
                    id: sensedAgent.id,
                    name: sensedAgent.name,
                    teamId: sensedAgent.teamId,
                    teamName: sensedAgent.teamName,
                    x: sensedAgent.x,
                    y: sensedAgent.y,
                    score: sensedAgent.score,
                    penalty: sensedAgent.penalty
                } );
                // console.log('Sensor.js', this.#agent.id, 'sensing', sensedAgent.id, 'at', sensedAgent.x, sensedAgent.y);
            }
            // else // no agent sensed on this tile
        }

        // for each observed tile, check if a parcel is sensed on it
        for ( let xy of positions ) {
            for ( let p of this.#grid.parcelRegistry.getByXy( xy ) ) {
                parcels.push( {
                    id: p.id,
                    x: p.x,
                    y: p.y,
                    carriedBy: p.carriedBy ? p.carriedBy.id : null,
                    reward: p.reward
                } );
            }
        }

        // for each observed tile, check if a crate is sensed on it
        for ( let xy of positions ) {
            for ( let c of this.#grid.crateRegistry.getByXy( xy ) ) {
                crates.push( {
                    id: c.id,
                    x: c.x,
                    y: c.y
                } );
            }
        }

        // console.log(`Sensor.js ${this.#agent.id} sensing an area of ${positions.length} tiles with: ${agents.length} agents, ${parcels.length} parcels, ${crates.length} crates`);

        this.sensing = { positions, agents, parcels, crates };

    }



}


export default Sensor;
