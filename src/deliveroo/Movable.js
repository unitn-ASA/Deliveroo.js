const MOVEMENT_DURATION = 1000;


/**
 * @typedef {Object} Movable
 * @extends Observable
 */
const Movable = staticObservable ('xy') ( class extends Observable {
    #grid;
    /** @attribute {Xy} */
    xy;
    
    /**
     * @constructor Movable
     * @param {Grid} grid
     */
    constructor ( grid ) {
        super();
        this.xy = new Xy(1,1);
        this.#grid = grid;
    }

    get tile() {
        return this.#grid.getTile( this.xy.x, this.xy.y );
    }

    async move (incr_x, incr_y ) {
        let fromTile = this.tile;
        if (!fromTile)
            return;
        let toTile = this.#grid.getTile( this.xy.x + incr_x, this.xy.y + incr_y );
        if (!toTile)
            return;
        if ( toTile && !toTile.blocked && !toTile.locked ) {
            toTile.lock(this.id)
            for(let progress = 0; progress < 100; progress += 10) {
                await new Promise( res => setTimeout(res, MOVEMENT_DURATION / 10))
                this.xy = new Xy( (this.xy.x * 10 + incr_x ) / 10, (this.xy.y * 10 + incr_y ) / 10 );
                // console.log("moving into ", this.xy)
            }
            fromTile.unlock();
            for (const id of this.#grid.getAgentIds()) {
                var a = this.#grid.getAgent(id)
                if ( a.xy.distance(this.xy) < 3 ) {
                    a.notifyAll('xy')
                    Agent.notifyAll('xy', a)
                }
            }
            return true;
        }
        return false;
    }

    up () {
        return this.move(0, 1);
    }

    down () {
        return this.move(0, -1);
    }

    left () {
        return this.move(-1, 0);
    }

    right () {
        return this.move(1, 0);
    }
})



module.exports = Movable;