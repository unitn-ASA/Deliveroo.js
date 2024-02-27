import { Agent } from './Agent.js';
import { Parcel } from './Parcel.js';
import { Gui } from './Gui.js';
import { Client } from './Client.js';
import { Controller } from './Controller.js';
import { Leaderboard } from './Leaderboard.js';
import { Tile } from './Tile.js';



class Game {
    
    /** @type {Client} */
    client;

    /** @type {Gui} */
    gui;

    /** @type {Controller} */
    ìcontroller;
    
    /** @type {Agent} */
    me;

    /** @type {Map<string,THREE.Color>} team to color */
    teamsAndColors = new Map();

    /** @type {Map<string,Agent>} id to agent */
    agents = new Map();

    /**
     * @param {string} id 
     * @param {string} name 
     * @param {string} team
     * @param {number} x 
     * @param {number} y 
     * @param {number} score 
     * @returns {Agent}
     */
    getOrCreateAgent ( id, name='unknown', team='', x=-1, y=-1, score=-1 ) {
        var agent = this.agents.get(id);
        if ( !agent ) {
            
            agent = new Agent( this, id, name, team, x, y, score );
            this.gui.clickables.push( agent.mesh );

            this.agents.set( id, agent );
        }
        return agent;
    }

    /** @type {Map<string,Parcel>} parcels by id */
    parcels = new Map();

    getOrCreateParcel ( id, x=-1, y=-1, carriedBy=null, reward=-1 ) {
        var parcel = this.parcels.get(id);
        if ( !parcel ) {
            parcel = new Parcel( this, id, x, y, carriedBy, reward );
            this.parcels.set( id, parcel );
        }
        return parcel;
    }

    deleteParcel ( id ) {
        this.getOrCreateParcel( id ).removeMesh();
        this.parcels.delete( id );
    }

    /** @type {Map<Number,Tile>} Tile by id (=x+1000*y) */
    tiles = new Map();

    setTile(x, y, delivery) {
        if ( !this.tiles.has(x + y*1000) )
            this.tiles.set( x + y*1000, new Tile(this.gui, x, y, delivery) );
        return this.tiles.get( x + y*1000 );
    }

    getTile(x, y) {
        if ( !this.tiles.has(x + y*1000) )
            this.tiles.set( x + y*1000, new Tile(this.gui, x, y) );
        return this.tiles.get( x + y*1000 );
    }

    /** @type {Leaderboard} leaderboard */
    leaderboard;
    

    /**
     * 
     * @param {{token: string, name: string, match: string, team: string}} options
     */
    constructor ( options ) {

        this.client = new Client( this, options );
        
        this.controller = new Controller( this.client );

        // const me = this.me = this.getOrCreateAgent( options.id, options.name, options.team, 0, 0, 0 );
        
        this.gui = new Gui( );

        // me.mesh.add( scene.camera );
        // this.gui.setTarget( me.mesh );

        this.leaderboard = new Leaderboard( this );

    }

}



export { Game };