const Observable =  require('./Observable')
const Tile =  require('./Tile')
const Agent =  require('./Agent')
const Entity = require('./Entity');
const Xy = require('./Xy');
const MenagerTiles = require('../workers/ManagerTiles');




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
        
        this.#tiles = MenagerTiles.spawnTiles(map, this)

        this.#agents = new Map();
        this.#entities = new Map();
        
    }



    //TILES METHODS
    

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
        
        //return Array.from(this.#tiles);
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
     * Removes a tile at the specified (x, y) position.
     * @param {number} x - The x-coordinate.
     * @param {number} y - The y-coordinate.
     * @returns {boolean} - Returns true if the tile was successfully removed, false otherwise.
     */
    removeTile(x, y) {
        if (x >= 0 && y >= 0 && x < this.#tiles.length && y < this.#tiles[0].length) {
            if (this.#tiles[x][y]) {
                this.#tiles[x][y] = null;
                return true;
            }
        }
        return false;
    }

    /**
     * Adds a tile at the specified (x, y) position.
     * @param {number} x - The x-coordinate.
     * @param {number} y - The y-coordinate.
     * @param {Tile} tile - The tile to add.
     * @returns {boolean} - Returns true if the tile was successfully added, false otherwise.
     */
    addTile(x, y, tile) {
        if (x < 0 || y < 0) return false;

        // Expand the grid if necessary
        while (x >= this.#tiles.length) {
            this.#tiles.push(new Array(this.#tiles[0].length).fill(null));
        }
        while (y >= this.#tiles[0].length) {
            this.#tiles.forEach(row => row.push(null));
        }

        this.#tiles[x][y] = tile;

        this.emit('tile', tile)
        return true;
    }


    //AGENTS METHODS

    /**
     * @type {function(): string[]}
     */
    getAgentIds () {
        return this.#agents.keys();
    }
    
    getAgents () {
        return this.#agents.values();
    }

    getAgent(identifier, y = null) {
        if (y === null) {
            // Se 'y' non è fornito, presumiamo che 'identifier' sia un ID
            return this.#agents.get(identifier);
        } else {
            // Se 'y' è fornito, presumiamo che 'identifier' sia la coordinata x
            for (let agent of this.#agents.values()) {
                if (agent.x === identifier && agent.y === y) {
                    return agent;
                }
            }
            return null; // Nessun agente trovato alle coordinate specificate
        }
    }

    /**
     * @type {function(agent:Agent}
     */
    addAgent ( agent ) { 
        // Register
        this.#agents.set(agent.id, agent);

        // Grid scoped events propagation
        agent.on( 'update', this.emit.bind(this, 'agent') );

        // On mine or others movement emit SensendAgents
        this.on( 'agent', ( who ) => {
            if ( agent.id == who.id || !( Xy.distance(agent, who) > agent.get('agents_observation_distance') ) ) {
                agent.emitAgentSensing()
            }
        } )
        
        // On parcel and my movements emit parcels sensing
        this.on( 'update', () => { agent.emitEntitySensing()} );

        agent.on( 'xy', () => { 
            agent.emitEntitySensing()
        } );

    }

    /**
     * 
     * @param {Agent} agent 
     */
    removeAgent ( agent ) {
        agent.removeListener( 'update', this.emit.bind(this, 'agent') );
        this.#agents.delete( agent.id );
        this.emit( 'agent deleted', agent );
    }


    // ENTITY METHODS
    
    /**
     * @type {function(Number, Number, Entity): void}
     */
    addEntity ( entity ) {
        this.#entities.set( entity.id, entity )
    }

    getEntity(identifier, y = null) {
        if (y === null) {
            // Se 'y' non è fornito, presumiamo che 'identifier' sia un ID
            return this.#entities.get(identifier);
        } else {
            // Se 'y' è fornito, presumiamo che 'identifier' sia la coordinata x
            for (let entity of this.#entities.values()) {
                if (entity.x === identifier && entity.y === y) {
                    return entity;
                }
            }
            return null; // Nessun agente trovato alle coordinate specificate
        }
    }

    /**
     * @type {function(): IterableIterator<Entity>}
     */
    getEntities(entityType = null) {
        if (entityType) {
          return Array.from(this.#entities.values()).filter(entity => entity.type == entityType);
        }
        return this.#entities.values();
      }

    /**
     * @type {function(): number}
     */
    getEntitiesQuantity(entityType = null) {
        if (entityType) {
          return Array.from(this.getEntities(entityType)).length;
        }
        return this.#entities.size;
      }

    /**
     * @type {function(String):boolean}
     */
    removeEntity ( id ) {
        return this.#entities.delete( id );
    }

}


module.exports = Grid;