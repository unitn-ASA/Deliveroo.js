const Observable =  require('../utils/Observable')
const Xy =  require('./Xy')
const Grid =  require('./Grid')
const Tile =  require('./Tile');



const MOVEMENT_DURATION = 1000;


/**
 * @class Agent
 * @extends Observable
 * @property {Set<Agent>} sensing agents in the sensed area
 */
class Sensor extends Xy {
    
    // /** @property {Grid} #grid */
    // #grid;
    /** @property {string} id */
    id;
    /** @property {Set<Agent>} sensing agents in the sensed area */
    sensing;
    
    /**
     * @constructor Agent
     * @param {string} id
     * @param {Grid} grid
     */
    constructor ( id, grid ) {
        super(undefined, undefined);

        // Make observable
        this.interceptValueSet('x', 'xy')
        this.interceptValueSet('y', 'xy')
        this.interceptValueSet('score', 'score')
        this.on('xy', this.emitOnePerTick.bind(this, 'agent') );
        this.on('score', this.emitOnePerTick.bind(this, 'agent') );

        {
            let x, y, found=false;
            for (x=0; x<10 && !found; x++)
                for (y=0; y<10 && !found; y++) {
                    found = ( grid.getTile(x, y).blocked ? false : grid.getTile(x, y).lock() );
                    // console.log( x, y, (found?'found':'occupied') )
                }
            if ( !found )
                throw new Error('no unlocked available tiles on the grid')
            this.x = --x
            this.y = --y
        }

        this.#grid = grid;
        this.id = id;
        this.sensing = new Set();

        // Error // Cannot redefine property: xy
        // this.xy = new Xy(1,1); Object.getOwnPropertyDescriptor(this, 'xy').set(new Xy(1,1));
        
        // Observe agents x y (incluse me) and update sensing
        const me = this;
        const computeSensing = (it) => {
            if ( it.id == me.id ) {
                for ( const id of grid.getAgentIds() ) {
                    if ( id != me.id )
                        computeSensing( grid.createAgent(id) );
                }
            }
            else {
                // console.log('computing', this.id, 'vs', it.id)
                if ( it.distance(me) < 5 ) {
                    if ( !this.sensing.has(it) ) {
                        // console.log(this.id, 'start sensing agent', it.id )
                        this.sensing.add(it);
                    }
                    // console.log(this.id, 'sensing agent', it.id )
                this.emit( 'sensing agent', it.id, it.x, it.y, it.score )
                }
                else {
                    if ( this.sensing.has(it) ) {
                        // console.log(this.id, 'no more sensing agent', it.id )
                        this.emit( 'sensing agent', it.id, undefined, undefined, it.score )
                        this.sensing.delete(it);
                    }
                }
            }
        }
        // Trigger initial sensing
        computeSensing( this );
        // On mine and others movement re-compute sensing
        grid.on( 'agent xy', (it) => {
            computeSensing(it);
        });
        // On others score re-compute sensing
        grid.on( 'agent score', (it) => {
            if ( it.id != me.id ) computeSensing(it);
        });

        /** Parcel sensing */
        grid.on( 'parcel added', (id, x, y, reward) => {
            this.emitParcelSensing();
        });
        grid.on( 'parcel removed', (id) => {
            this.emitParcelSensing();
        });
        
    }

    emitParcelSensing () {
        var parcels = [];
        for ( var tile of this.#grid.getTiles() ) {// [this.x-5, this.x+5, this.y-5, this.y+5] ) ) {
            let {x, y} = tile;
            if ( tile.distance(this) < 5 ) {
                for ( let parcel of tile.parcels ) {
                    let {id, reward} = parcel;
                    parcels.push( {id, x, y, reward} )
                }
            }
        }
        this.emitOnePerTick( 'parcel sensing', parcels )
    }

    get tile() {
        return this.#grid.getTile( Math.round(this.x), Math.round(this.y) );
    }
    
}



module.exports = Agent;