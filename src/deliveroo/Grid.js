const Observable =  require('./Observable')
const Tile =  require('./Tile')
const Agent =  require('./Agent')
const Entity = require('./Entity');
const Xy = require('./Xy');
const config =  require('../../config');



/**
 * @class Grid
 */
class Grid extends Observable {
    /** @type {Array<Tile>} */
    #tiles;
    /** @type {Map<string, Agent>} */
    #agents;
    /** @type {Map<string, Entity>} */
    #entities;
    
    /**
     * @constructor Grid
     */
    constructor ( map = new Array(10).map( c=>new Array(10) ) ) {
        super();
        this.setMaxListeners(500);
        
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
        // console.log( this.#tiles.map( c=>c.map( t=>t.x+' '+t.y+' ' ) ) )

        this.#agents = new Map();
        this.#entities = new Map();
        
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
     * @type {function({id:string,name:string}): Agent}
     */
    createAgent ( options = {} ) {
        
        // Instantiate
        var me = new Agent( this, options );
        this.emit( 'agent created', me );

        // Register
        this.#agents.set(me.id, me);

        // Grid scoped events propagation
        me.on( 'xy', this.emit.bind(this, 'agent xy') );
        me.on( 'score', this.emit.bind(this, 'agent score') );
        // me.on( 'pickup', this.emit.bind(this, 'agent pickup') );
        // me.on( 'putdown', this.emit.bind(this, 'agent putdown') );
        // me.on( 'agent', this.emit.bind(this, 'agent') );

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

        // On others score emit SensendAgents
        this.on( 'agent score', ( who ) => {
            if ( me.id != who.id && !( Xy.distance(me, who) >= me.config.AGENTS_OBSERVATION_DISTANCE ) ) {
                me.emitAgentSensing()
            }
        } )

        // On parcel and my movements emit parcels sensing
        this.on( 'update-entity', () => { me.emitEntitySensing()} );
        me.on( 'xy', () => me.emitEntitySensing() );

        return me;
    }

    /**
     * 
     * @param {Agent} agent 
     */
    deleteAgent ( agent ) {
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
     * @type {function(Number, Number, Entity): Entity}
     */
    createEntity ( x, y, entity ) {
        var tile = this.getTile( x, y );
        if ( !tile || tile.blocked )
            return false;
        
        this.#entities.set( entity.id, entity )

        entity.once( 'expired', (...args) => {
            this.deleteEntity( entity.id );
        } );

        // Grid scoped event propagation
        this.emit( 'entity', entity )
        entity.on( 'update-entity', () => {
            this.emit('update-entity') 
        });

        return entity;
    }

    /**
     * @type {function(): IterableIterator<Parcel>}
     */
    getEntities () {
        return this.#entities.values();
    }

    /**
     * @type {function(): number}
     */
    getEntitiesQuantity () {
        return this.#entities.size;
    }

    /**
     * @type {function(String):boolean}
     */
    deleteEntity ( id ) {
        return this.#entities.delete( id );
    }

}


module.exports = Grid;