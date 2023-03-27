const Observable =  require('./Observable')
const Tile =  require('./Tile')
const Agent =  require('./Agent')
const Parcel = require('./Parcel');
const Xy = require('./Xy');



/**
 * @class Grid
 */
class Grid extends Observable {
    /** @type {Array<Tile>} */
    #tiles;
    /** @type {Map<string, Agent>} */
    #agents;
    /** @type {Map<string, Parcel>} */
    #parcels;
    
    /**
     * @constructor Grid
     */
    constructor ( map = new Array(10).map( c=>new Array(10) ) ) {
        super();
        
        var Xlength = map.length;
        var Ylength = map.length;
        this.#tiles = Array.from(map).map( (column, x) => {
            return Array.from(column).map( (blocked, y) => new Tile(this, x, y, blocked, ( x==0 || x==Xlength-1 || y==0 || y==Ylength-1 ? true : false )) )
        } );
        // console.log( this.#tiles.map( c=>c.map( t=>t.x+' '+t.y+' ' ) ) )
        
        // this.#tiles = [];
        // for (let x = 0; x < 10; x++) {
        //     let column = [];
        //     for (var y = 0; y < 10; y++) {
        //         column.push(new Tile(this, x, y))
        //     }
        //     this.#tiles.push(column);
        // }

        this.#agents = new Map();
        this.#parcels = new Map();
        
        // // Dispatch all my events
        // this.observe( Game.dispatcher.triggerEvents.bind(Game.dispatcher) );
    }

    *getTiles ( [x1,x2,y1,y2]=[0,10000,0,10000] ) {
        const xLength = ( this.#tiles.length ? this.#tiles.length : 0 );
        const yLength = ( this.#tiles.length && this.#tiles[0].length ? this.#tiles[0].length : 0 );
        x1 = Math.max(0,x1)
        x2 = Math.min(xLength,x2);
        y1 = Math.max(0,y1)
        y2 = Math.min(yLength,y2);
        // console.log(xLength, yLength, x1, x2, y1, y2)
        for ( let x = x1; x < x2; x++ )
            for ( let y = y1; y < y2; y++ ) {
                var tile = this.#tiles.at(x).at(y);
                if ( tile ) yield tile;
            }
        // return Array.from(this.#tiles).flat();
    }

    getMapSize () {
        return { width: this.#tiles.length, height:this.#tiles.at(0).length }
    }

    /**
     * @type {function(number,number): Tile}
     */
    getTile ( x, y ) {
        if ( x < 0 || y < 0)
            return null;
        // x = Math.round(x)
        // y = Math.round(y)
        let column = this.#tiles.at(x)
        return column ? column.at(y) : null;
    }

    /**
     * @type {function(): string[]}
     */
    getAgentIds () {
        return this.#agents.keys();
    }
    
    getAgents () {
        return this.#agents.values();
    }

    getAgent ( id ) {
        return this.#agents.get( id );
    }

    /**
     * @type {function({id:string,name:string}): Agent}
     */
    createAgent ( { id, name } ) {
        
        // Instantiate
        var me = new Agent( this, { id, name } );
        this.emit( 'agent created', me );

        // Register
        this.#agents.set(me.id, me);

        // Grid scoped events propagation
        me.on( 'xy', this.emit.bind(this, 'agent xy') );
        me.on( 'score', this.emit.bind(this, 'agent score') );
        // me.on( 'pickup', this.emit.bind(this, 'agent pickup') );
        // me.on( 'putdown', this.emit.bind(this, 'agent putdown') );
        // me.on( 'agent', this.emit.bind(this, 'agent') );
        
        const notMeAndWithin5 = ( fn ) => {
            return function (it, ...args) {
                if ( ( ! it.id || me.id != it.id ) && Xy.distance(me, it) < 5 )
                    fn (it, ...args)
            }
        }

        const ifNotMeAndWithin5EmitSensendAgents = notMeAndWithin5( me.emitAgentSensing.bind(me) );

        // On mine and others movement emit SensendAgents
        this.on( 'agent xy', me.emitAgentSensing.bind(me) )
        
        // On agent disconnect emit agentSensing
        // this.on( 'agent disconnect', me.emitAgentSensing.bind(me) )

        // On others score emit SensendAgents
        this.on( 'agent score', ifNotMeAndWithin5EmitSensendAgents )

        

        /**
         * Call wrapped function just once every nextTick.
         * @function postpone
         */
        function postpone ( finallyDo ) {
            var promiseFired = false;
            return async (...args) => {
                promiseFired = false;
                process.nextTick( () => { // https://jinoantony.com/blog/setimmediate-vs-process-nexttick-in-nodejs
                    if ( !promiseFired ) {
                        promiseFired = true;
                        finallyDo(...args);
                    }
                } );
            }
        }

        const thisGrid = this;
        const within5 = ( fn ) => {
            return function (p, ...args) {
                console.log(this) // this should be parcel since specified by .bind in emitting parcel state. NO x, y in parcel
                if ( Xy.distance(me, this) < 5 )
                    fn (p, ...args)
            }
        }

        // On parcel
        this.on( 'parcel', postpone( me.emitParcelSensing.bind(me) ) );

        return me;
    }

    deleteAgent ( agent ) {
        if ( agent.tile )
            agent.tile.unlock();
        agent.x = undefined;
        agent.y = undefined;
        agent.removeAllListeners('xy');
        agent.removeAllListeners('score');
        agent.removeAllListeners('agent');
        agent.removeAllListeners('agents sensing');
        agent.removeAllListeners('parcels sensing');
        this.#agents.delete( agent.id );
        this.emit( 'agent deleted', agent );
    }



    /**
     * @type {function(Number, Number): Parcel}
     */
    createParcel ( x, y ) {
        var tile = this.getTile( x, y );
        if ( !tile || tile.blocked )
            return false;
        
        // Instantiate and add to Tile
        var parcel = new Parcel( x, y );
        // tile.addParcel( parcel );
        this.#parcels.set( parcel.id, parcel )

        parcel.once( 'expired', (...args) => {
            this.deleteParcel( parcel.id );
        } );

        // Grid scoped event propagation
        this.emit( 'parcel', parcel )
        parcel.on( 'reward', this.emit.bind(this, 'parcel') );
        parcel.on( 'carriedBy', this.emit.bind(this, 'parcel') );

        return parcel;
    }

    /**
     * @type {function(): IterableIterator<Parcel>}
     */
    getParcels () {
        return this.#parcels.values();
    }

    /**
     * @type {function(String):boolean}
     */
    deleteParcel ( id ) {
        return this.#parcels.delete( id );
    }

}


module.exports = Grid;