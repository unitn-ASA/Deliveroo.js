const Observable =  require('./Observable')
const Tile =  require('./Tile')
const Agent =  require('./Agent')
const Parcel = require('./Parcel');
const Xy = require('./Xy');
const Config = require('./Config');


/**
 * @class Grid
 */
class Grid extends Observable {

    matchId;
    /** @type {Config} */
    #config;
    /** @type {Array<Tile>} */
    #tiles;
    /** @type {Map<string, Agent>} */
    #agents;
    getAgents() { return this.#agents; }
    /** @type {Map<string, Parcel>} */
    #parcels;
    
    /**
     * @constructor Grid
     */
    constructor ( matchId, config = new Config(), map = new Array(10).map( c=>new Array(10) ) ) {
        super();

        this.#config = config;
        this.matchId = matchId;
        
        var Xlength = map.length;
        var Ylength = Array.from(map).reduce( (longest, current)=>(current.length>longest.length?current:longest) ).length;
        this.#tiles = Array.from(map).map( (column, x) => {
            return Array.from(column).map( (value, y) => new Tile(
                this,       // grid
                x, y,       // x, y
                value == 0, // blocked
                value == 2, // delivery // ( x==0 || x==Xlength-1 || y==0 || y==Ylength-1 ? true : false )
                value == 1  // parcelSpawner
            ) )
        } );
        

        this.#agents = new Map();
        this.#parcels = new Map();
       

    }

    /**
     * @type {function():Generator<Tile, Tile, Tile>}
     */
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
        return { width: this.#tiles.length, height:this.#tiles.reduce( (longest, current) => (current.length>longest.length?current:longest) ).length }
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
     * @param {{ id: string, name: string, team: string }} options
     * @returns {Agent}
     */
    createAgent ( {id, name, team} ) {
        
        // Instantiate
        var me = new Agent( this, {id, name, team}, this.#config );
        this.emit( 'agent created', me );

        // Register
        this.#agents.set(me.id, me);

        // Grid scoped events propagation
        me.on( 'xy', this.emit.bind(this, 'agent xy') );
        //me.on( 'score', this.emit.bind(this, 'agent score') );
        me.on( 'score', () => { 
           // console.log('agente score:', me.id, me.name, me.team, me.score);
            this.emit('agente score', me.id, me.name, me.team, me.score); 
        });
        // me.on( 'pickup', this.emit.bind(this, 'agent pickup') );
        // me.on( 'putdown', this.emit.bind(this, 'agent putdown') );
        // me.on( 'agent', this.emit.bind(this, 'agent') );
        me.on( 'rewarded', this.emit.bind(this, 'agent rewarded') );

        // On mine or others movement emit SensendAgents
        this.on( 'agent xy', ( who ) => {
            if ( me.id == who.id || !( Xy.distance(me, who) > me.config.AGENTS_OBSERVATION_DISTANCE ) ) {
                me.emitAgentSensing()
            }
        } )
        
        // On agent deleted emit agentSensing
        this.on( 'agent deleted', ( who ) => {
            if ( me.id != who.id && !( Xy.distance(me, who) >= me.config.AGENTS_OBSERVATION_DISTANCE ) ) {
                me.emitAgentSensing()
            }
        } )

        // On others score emit agentSensing
        this.on( 'agent score', ( who ) => {
            if ( me.id != who.id && !( Xy.distance(me, who) >= me.config.AGENTS_OBSERVATION_DISTANCE ) ) {
                me.emitAgentSensing()
            }
        } )

        // On parcel and my movements emit parcels sensing
        this.on( 'parcel', () => me.emitParcelSensing() );
        me.on( 'xy', () => me.emitParcelSensing() );

        return me;
    }

    /**
     * 
     * @param {Agent} agent 
     */
    async deleteAgent ( agent ) {

        if ( agent.tile )
            agent.tile.unlock();
        agent.putDown();
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
        var parcel = new Parcel( x, y, null, this.#config );
        // tile.addParcel( parcel );
        this.#parcels.set( parcel.id, parcel )

        parcel.once( 'expired', (...args) => {
            this.deleteParcel( parcel.id );
        } );

        // Grid scoped event propagation
        this.emit( 'parcel', parcel )
        parcel.on( 'reward', this.emit.bind(this, 'parcel') );
        parcel.on( 'carriedBy', this.emit.bind(this, 'parcel') );
        parcel.on( 'xy', this.emit.bind(this, 'parcel') );

        return parcel;
    }

    /**
     * @type {function(): IterableIterator<Parcel>}
     */
    getParcels () {
        return this.#parcels.values();
    }

    /**
     * @type {function(): number}
     */
    getParcelsQuantity () {
        return this.#parcels.size;
    }

    /**
     * @type {function(String):boolean}
     */
    deleteParcel ( id ) {
        return this.#parcels.delete( id );
    }

    async destroy() {
        
        
        // Destroy all the agent of the grid
        for (let agent of this.#agents.values()) {
            //console.log(agent)
            agent.destroy();
            //console.log(agent)
            agent = null;
            //console.log(agent)
        }
        //console.log(this.#agents)
        this.#agents.clear();
        this.#agents = null
        //console.log(this.#agents)
        
        // Destroy all the parcels of the grid
        for (let parcel of this.#parcels.values()) {
            //console.log(parcel)
            parcel.destroy();
            //console.log(parcel)
            parcel = null;
            //console.log(parcel)
        }
        //console.log(this.#parcels)
        this.#parcels.clear();
        this.#parcels = null
        //console.log(this.#parcels)
        
        // Destroy all the parcels of the grid
        for (let row of this.#tiles.values()) {
            for (let tile of row.values()) {
                //console.log(tile)
                tile.destroy();
                //console.log(tile)
                tile = null;
                //console.log(tile)
            }
        }
        //console.log(this.#tiles)
        this.#tiles = null
        //console.log(this.#tiles)

        this.removeAllListeners();

        this.#config = null;

        console.log('\tGrid destroyed');
    }

}


module.exports = Grid;