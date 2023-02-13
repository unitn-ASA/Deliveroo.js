const Observable =  require('../utils/Observable')
const Xy =  require('./Xy')
const Grid =  require('./Grid')
const Tile =  require('./Tile');



const MOVEMENT_DURATION = 500;


/**
 * @class Agent
 * @extends Observable
 * @property {Set<Agent>} sensing agents in the sensed area
 */
class Agent extends Xy {
    
    /** @property {Grid} #grid */
    #grid;
    /** @property {string} id */
    id;
    /** @property {Set<Agent>} sensing agents in the sensed area */
    sensing;
    /** @property {Number} score */
    score = 0;
    /** @property {Set<Parcel>} #carryingParcels */
    #carryingParcels = new Set();
    get carrying () {
        return Array.from(this.#carryingParcels);
    }

    /**
     * @constructor Agent
     * @param {string} id
     * @param {Grid} grid
     */
    constructor ( id, grid ) {

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

        // Emit score on score assignment
        this.interceptValueSet('score', 'score')
        // group 'xy' and 'score' into 'agent' event
        this.on('xy', this.emitOnePerTick.bind(this, 'agent') );
        this.on('score', this.emitOnePerTick.bind(this, 'agent') );
        this.on('carrying', this.emitOnePerTick.bind(this, 'agent') );

        this.#grid = grid;
        this.id = id;
        this.sensing = new Set();
        this.score = 0;

    }

    /**
     * When called, evaluate sensing, with respect to a specified agent (it).
     * If the specified agent is me assume I moved and re-compute everything.
     * @type {function(): void}
     */
    evaluateSensing (it) {
        const me = this;
        if ( it.id == me.id ) {
            // re-evaluate all others
            for ( const id of this.#grid.getAgentIds() ) {
                if ( id != me.id )
                    this.evaluateSensing( this.#grid.getAgent(id) );
            }
            // evaluate parcels
            this.emitParcelSensing();
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

    async stepByStep ( incr_x, incr_y ) {
        var init_x = this.x
        var init_y = this.y
        // this.x += incr_x/2
        // this.y += incr_y/2
        for(let i=0; i<10; i++) {
            await new Promise( res => setTimeout(res, MOVEMENT_DURATION / 10))
            this.x = ( this.x * 10 + incr_x ) / 10; // this keep it rounded at .1
            this.y = ( this.y * 10 + incr_y ) / 10; // this keep it rounded at .1
            // console.log("moving into ", (init_x * 10 + incr_x * i ) / 10, this.y)
        }
        // this.x = init_x + incr_x
        // this.y = init_y + incr_y
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
        var tile = this.tile
        var picked = new Array();
        if ( tile ) {
            var counter = 0;
            for (const parcel of tile.parcels) {
                tile.removeParcel(parcel);
                this.#carryingParcels.add(parcel);
                this.emitOnePerTick( 'carrying', this );
                picked.push(parcel);
                counter++;
            }
            console.log(this.id, 'pickUp', counter, 'parcels')
        }
        return picked; // Array.from(this.#carryingParcels);
    }

    /**
     * @type {function(): void}
     */
    putDown () {
        var tile = this.tile
        var sc = 0;
        var dropped = new Array();
        if ( tile.delivery ) {
            for ( let parcel of this.#carryingParcels ) {
                this.#carryingParcels.delete(parcel);
                this.emitOnePerTick( 'carrying', this );
                dropped.push(parcel);
                sc += parcel.reward;
            }
        }
        else {
            for ( let parcel of this.#carryingParcels ) {
                this.#carryingParcels.delete( parcel );
                this.emitOnePerTick( 'carrying', this );
                dropped.push(parcel)
                tile.addParcel( parcel );
            }
        }
        console.log(this.id, 'putDown parcels for a total of', sc, 'pti')
        this.score += sc;
        return dropped;
    }
}



module.exports = Agent;