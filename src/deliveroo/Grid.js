const Observable =  require('./Observable')
const Tile =  require('./Tile')
const Agent =  require('./Agent')
const Parcel = require('./Parcel');
const Xy = require('./Xy');
const Config = require('./Config');

const RandomlyMoveAgent = require('../workers/RandomAgentMover');
const parcelsGenerator = require('../workers/ParcelsGenerator');

/**
 * @class Grid
 */
class Grid extends Observable {

    roomId;     // Id of the room

    /** @type {boolean} */
    freezed;     // status of the grid: it coul be freeze ( the grid is blocked ) or unfreeze ( the grid is sblocked )
    
    /** @type {Config} */
    #config;    //config of the grid
    get config () {  return this.#config; } 

    /** @type {Array<Array<Tile>>} */
    #tiles;     // array of the tiles of the grid

    /** @type {Map<string, Agent>} */
    #agents;    // array of hte agents in the grid
    lastId = 0; //last id for the autonomous agent

    /** @type {Map<string,Set<Agent>} agents in each team */
    #teamsAgents = new Map();   // map with keys the team id, and onbject the list of agent belong to that team 

    /** @type {Map<string, Parcel>} */
    #parcels;   //array of the parcels in the match 

    /** @type {parcelsGenerator} */
    #parcelsGenerator;  //object that menage the spawn of the parcels

    /** @type {RandomlyMoveAgent[]} */
    #randomlyMovingAgents; // object htat menage the autonomus agent 
    
    /**
     * @constructor Grid
     */
    constructor ({roomId, config} ) {
        super();

        this.#config = config;
        this.roomId = roomId;

        // Load map    
        let map = require( '../../levels/maps/' + this.#config.MAP_FILE + '.json' );
        
        var Xlength = map.map.length;
        var Ylength = Array.from(map.map).reduce( (longest, current)=>(current.length>longest.length?current:longest) ).length;

        this.#tiles = Array.from(map.map).map( (column, x) => {
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

        // Parcels generator
        this.#parcelsGenerator = new parcelsGenerator( this.#config, this );
        
        // Randomly moving agents
        this.#randomlyMovingAgents = [];
        for (let i = 0; i < this.#config.RANDOMLY_MOVING_AGENTS; i++) {
            let randomlyMoveAgent = new RandomlyMoveAgent( this.#config, this );
            randomlyMoveAgent.start()
            this.#randomlyMovingAgents.push( randomlyMoveAgent );
        }

        //default the status of the grid is unfreeze
        this.freezed = false;

        console.log(`\t- grid created:`);
    }

    /**
     * @generator
     * @function getTiles
     * @param {Array<Number>} [x1=0, x2=10000, y1=0, y2=10000]
     * @yields {Tile}
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
     * @type {function(): IterableIterator<string>}
     */
    getAgentIds () {
        return this.#agents.keys();
    }
    
    /**
     * @type {function(): IterableIterator<Agent>}
     */
    getAgents () {
        return this.#agents.values();
    }

    getAgent ( id ) {
        return this.#agents.get( id );
    }

    /**
     * @param {{ id: string, name: string, teamId: string, teamName: string }} userParam
     * @returns {Agent}
     */
    createAgent ( userParam = {id, name:undefined, teamId:undefined, teamName:undefined} ) {
        
        // Instantiate
        var me = new Agent( this, userParam, this.#config );
        this.emit( 'agent created', me );

        // Register
        this.#agents.set(me.id, me);

        // Grid scoped events propagation
        me.on( 'xy', this.emit.bind(this, 'agent xy') );
        me.on( 'score', () => { 
           // console.log('agente score:', me.id, me.name, me.team, me.score);
            this.emit('agente score', me.id, me.name, me.teamName, me.score); 
        });
        
        // when an agent score, the grid emit the event so the match can save the score
        me.on( 'rewarded', async (agent,sc) => {this.emit('agent reward', agent, sc ) });

        // On mine or others movement emit SensendAgents
        this.on( 'agent xy', ( who ) => {
            if ( me.id == who.id || !( Xy.distance(me, who) > me.config.AGENTS_OBSERVATION_DISTANCE ) ) {
                me.emitAgentSensing(this)
            }
        } )
        
        // On agent deleted emit agentSensing
        this.on( 'agent deleted', ( who ) => {
            if ( me.id != who.id && !( Xy.distance(me, who) >= me.config.AGENTS_OBSERVATION_DISTANCE ) ) {
                me.emitAgentSensing(this)
            }
        } )

        // On others score emit agentSensing
        this.on( 'agent score', ( who ) => {
            if ( me.id != who.id && !( Xy.distance(me, who) >= me.config.AGENTS_OBSERVATION_DISTANCE ) ) {
                me.emitAgentSensing(this)
            }
        } )

        // On parcel and my movements emit parcels sensing
        this.on( 'parcel', () => me.emitParcelSensing(this) );
        me.on( 'xy', () => me.emitParcelSensing(this) );

        // Team
        var teamMates = this.#teamsAgents.get( userParam.teamId );
        if( userParam.teamId != undefined ){
            if ( ! teamMates ) {
                teamMates = new Set();
                this.#teamsAgents.set( userParam.teamId, teamMates );
                console.log(`/${this.roomId} Addet the team `, userParam.teamName +'(', userParam.teamId + ') ',  )
            }
            if ( ! teamMates.has( me ) ) {
                teamMates.add( me );
                console.log(`/${this.roomId} Adding agent `, me.id +'(', me.name + ') to team ',  userParam.teamId + ': ', printSet(this.#teamsAgents.get( userParam.teamId)) )
            }
        }


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
            return undefined;
        
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
        if(this.#parcels){
            return this.#parcels.delete( id );
        }else{
            return
        }
        
    }

    //Block the grid 
    async freeze(){
        this.freezed = true;
        await Promise.all(this.#randomlyMovingAgents.map(a => a.stop()));   //stop all the autonomous agent
        this.emit('freeze');
        return true
    }

    //Unblock the grid 
    async unfreeze(){
        this.freezed = false;
        await Promise.all(this.#randomlyMovingAgents.map(a => a.start()));  //restart all the autonomus agent
        this.emit('unfreeze');
        return true
    }

    async destroy() {

        try{
            // Stop the motion of the agent
            await Promise.all(this.#randomlyMovingAgents.map(a => a.stop()));
            console.log('\tGRID DESTROY: autonomus agents stoped');
            // Destroy the generator of parcels
            this.#parcelsGenerator.destroy();
            console.log('\tGRID DESTROY: parcel generetor destroyed');

            // Destroy all the agent of the grid
            console.log(`\tGRID DESTROY: Delete Agents`);
            for (let agent of this.#agents.values()) {
                agent.destroy();
                // console.log('\t\tdelete agent ', agent.id, ' -> ', agent.listenerCount());
            }
            //console.log(this.#agents)
            this.#agents.clear();
            this.#agents = null
            //console.log(this.#agents)
            
            // Destroy all the parcels of the grid
            console.log(`\tGRID DESTROY: Delete PArcels`);
            for (let parcel of this.#parcels.values()) {
                parcel.destroy();
                console.log('\t\tdelete parcel ', parcel.id, ' -> ', parcel.listenerCount());
            }
            //console.log(this.#parcels)
            this.#parcels.clear();
            
            // Destroy all the tiles of the grid
            for (let row of this.#tiles.values()) {
                for (let tile of row.values()) {
                    //console.log(tile);
                    tile.destroy();
                }
            }

            this.removeAllListeners();

            console.log(`\tGrid destroyed`);
    
        } catch (error) {
            console.error( error );
        }

    }

}


// function only for debug print 
function printSet(set) {
    let output = "[";
    let isFirst = true;
    
    set.forEach(function(element) {
      if (!isFirst) {
        output += ", ";
      }
      output += element.id;
      output += '(';
      output += element.name;
      output += ')';
      isFirst = false;
    });
  
    output += "]";
    return output;
}




module.exports = Grid;