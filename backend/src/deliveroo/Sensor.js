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

    /** @type {(who: Agent) => void} - Grid agent listener */
    #agentListener = ( who ) => {
        // On my movements emit agents, parcels and crates sensing
        if ( this.#me.id == who.id ) {
            this.#sensingDirty = true;
        }
        // On others movements within my range (plus border), emit agents sensing
        else if ( ( Xy.distance(this.#me, who) < (config.GAME.player.observation_distance + 1) ) ) {
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
            grid.emitter.onAgentXy( this.#agentListener );
            grid.emitter.onAgentDeleted( this.#agentListener );
            grid.emitter.onAgentScore( this.#agentListener );

            // On parcel and my movements emit parcels sensing
            grid.emitter.onParcel( this.#parcelListener );

            // On crate and my movements emit crates sensing
            grid.emitter.onCrate( this.#crateListener );

            // On my movements emit parcels and crates sensing
            // agent.emitter?.on( 'xy', this.#myXyListener );

            me.emitter?.on( 'deleted', () => {
                // Cleanup listeners when I'm deleted
                grid.emitter.offAgentXy( this.#agentListener );
                grid.emitter.offAgentDeleted( this.#agentListener );
                grid.emitter.offAgentScore( this.#agentListener );
                grid.emitter.offParcel( this.#parcelListener );
                grid.emitter.offCrate( this.#crateListener );
                me.emitter?.off( 'xy', this.#myXyListener );
                this.emitter.removeAllListeners();
            });

        }

        // Fire on each frame if dirty
        myClock.on('frame', () => {

            if (this.#sensingDirty) {

                // start time
                // const start = performance.now();
                
                this.computeSensing();
                
                // end time
                // const end = performance.now();
                // console.log(`Sensor.js ${me.name} at frame#${myClock.frame} computeSensing took ${end - start} ms`);

            }

        });

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
            // if my position is undefined
            if ( this.#me.x == undefined && this.#me.y == undefined ) {
                positions.push( {x: tile.x, y: tile.y} );
                continue;
            }
            // if within observation distance
            const dist = Xy.distance(tile, this.#me);
            if ( dist <= config.GAME.player.observation_distance )
                positions.push( {x: tile.x, y: tile.y} );
        }

        // for each observed agent at distance strict < observation_distance + 1 (to include agents moving out of sensed tiles)
        for ( let a of this.#grid.agentRegistry.getIterator() ) {
            // if defined and not myself
            if ( a && a != this.#me  ) {
                const dist = Xy.distance(a, this.#me);
                if ( dist < config.GAME.player.observation_distance + 1 ) {
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
                    // console.log('Sensor.js', this.#agent.id, 'sensing', sensedAgent.id, 'at', sensedAgent.x, sensedAgent.y);
                }
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

        // for each observed crate at distance strict < observation_distance + 1 (to include agents moving out of sensed tiles)
        for ( let c of this.#grid.crateRegistry.getIterator() ) {
            const dist = Xy.distance(c, this.#me);
            if ( dist < config.GAME.player.observation_distance + 1 ) {
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
