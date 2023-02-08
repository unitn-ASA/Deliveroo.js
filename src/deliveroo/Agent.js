const Observable =  require('../utils/Observable')
const Xy =  require('./Xy')
const Grid =  require('./Grid')
const Tile =  require('./Tile');



const MOVEMENT_DURATION = 1000;


/**
 * @class Agent
 * @extends Observable
 * @property {Xy} xy
 * @property {Set<Agent>} sensing agents in the sensed area
 */
class Agent extends Observable {
    
    /** @attribute {Grid} #grid */
    #grid;
    /** @attribute {Set<Parcel>} #carryingParcels */
    #carryingParcels = new Set();
    /** @attribute {string} id */
    id;
    /** @attribute {Xy} xy */
    xy;
    /** @property {Set<Agent>} sensing agents in the sensed area */
    sensing;
    /** @property {Number} score */
    score;
    
    /**
     * @constructor Agent
     * @param {string} id
     * @param {Grid} grid
     */
    constructor ( id, grid ) {
        super();
        
        // // Dispatch all my events
        // this.observe( Game.dispatcher.triggerEvents.bind(Game.dispatcher) );

        // Make observable
        this.interceptValueSet('xy')
        this.interceptValueSet('score')

        this.#grid = grid;
        this.id = id;
        this.sensing = new Set();

        let tile = undefined;
        for (var x=0; x<10; x++) {
            for (var y=0; y<10; y++) {
                tile = grid.getTile({x,y})
                if ( !tile.locked ) {
                    tile.lock();
                    this.xy = new Xy(x,y);
                    break;
                }
            }
            if ( this.xy ) break;
        }
        if ( !this.xy ) {
            throw new Error('no unlocked available tiles on the grid')
        }
        // this.xy = new Xy(1,1); // Cannot redefine property: xy // Object.getOwnPropertyDescriptor(this, 'xy').set(new Xy(1,1));
        
        // Observe agents xy (incluse me) and update sensing
        const me = this;
        const computeSensing = (it) => {
                if (it.id != me.id ) {
                    // console.log('computing', this.id, 'vs', it.id)
                    if ( it.xy.distance(me.xy) < 5 ) {
                        if ( !this.sensing.has(it) ) {
                            // console.log(this.id, 'start sensing agent', it.id )
                            this.sensing.add(it);
                        }
                        // console.log(this.id, 'sensing agent', it.id )
                        this.triggerEvent( new Observable.Event('sensing agent', it, me) )
                    }
                    else {
                        if ( this.sensing.has(it) ) {
                            // console.log(this.id, 'no more sensing agent', it.id )
                            this.triggerEvent( new Observable.Event('no more sensing agent', it, me) )
                            this.sensing.delete(it);
                        }
                    }
                }
        }
        for ( const id of grid.getAgentIds() ) {
            computeSensing( grid.getAgent(id) );
        }
        // Wait to be notified about others movement and re-compute sensing
        grid.observe( (events) => {
            for ( const ev of events ) {
                const it = ev.subject;
                computeSensing(it);
            }
        }, ev => ev.name == 'changed' && ev.object == 'xy' && ev.subject instanceof Agent )//&& ev.subject.xy.x % 1 == 0 && ev.subject.xy.y % 1 == 0 );
        
    }

    get tile() {
        return this.#grid.getTile( this.xy );
    }

    async stepByStep ( incr_x, incr_y ) {
        for(let progress = 0; progress < 100; progress += 10) {
            await new Promise( res => setTimeout(res, MOVEMENT_DURATION / 10))
            const oldXy = this.xy;
            // this.xy = new Xy( 0, 0 ); // This is a test!
            this.xy = new Xy( (oldXy.x * 10 + incr_x ) / 10, (oldXy.y * 10 + incr_y ) / 10 );
            // console.log("moving into ", this.xy)
        }
    }

    moving = false;
    async move ( incr_x, incr_y ) {
        if ( this.moving ) // incr_x%1!=0 || incr_y%1!=0 ) // if still moving
            return false;
        let fromTile = this.tile;
        // if (!fromTile)
        //     return false;
        let toXy = this.xy.moveX(incr_x).moveY(incr_y)
        let toTile = this.#grid.getTile( toXy );
        if ( toTile && !toTile.blocked && !toTile.locked ) {
            // console.log(this.id, 'start move in', toXy.toString())
            this.moving = true;
            toTile.lock();
            await this.stepByStep( incr_x, incr_y );
            console.log(this.id, 'done move in', toXy.toString())
            this.moving = false;
            fromTile.unlock();
            return true;
        }
        console.log(this.id, 'fail move in', toXy.toString())
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
     * @type {function(Parcel): void}
     */
    pickUp ( parcel ) {
        if ( this.tile.isParcelHere(parcel) ) {
            this.#carryingParcels.add(parcel);
            this.tile.parcels.delete(parcel);
            return true;
        }
        return false;
    }

    /**
     * @type {function(Parcel): void}
     */
    putdown ( parcel ) {
        if ( this.#carryingParcels.has(parcel) ) {
            this.tile.parcels.add(parcel);
            this.#carryingParcels.delete(parcel);
            return true;
        }
        return false;
    }
}



module.exports = Agent;