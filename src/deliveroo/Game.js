const Grid = require('./Grid');
const randomlyMovingAgent = require('../workers/randomlyMovingAgent');
const parcelsGenerator = require('../workers/parcelsGenerator');
const config = require('../../config');

class Game {

    static #lastId = 0;

    id
    grid

     /**
     * @type {Map<string,{agent:Agent,sockets:Set<Socket>}>} idToAgentAndSockets
     */
     idToAgentAndSockets = new Map();

    constructor(mappa, random_mov_agents){

        this.id = Game.#lastId;
        Game.#lastId++;

        const MAP_FILE = mappa || config.MAP_FILE || process.env.MAP_FILE || "default_map";
        const RANDOMLY_MOVING_AGENTS = random_mov_agents || config.RANDOMLY_MOVING_AGENTS || process.env.RANDOMLY_MOVING_AGENTS || 0;

        const map = require( '../../levels/maps/' + MAP_FILE );
        this.grid = new Grid( map );

        parcelsGenerator( this.grid );

        for (let i = 0; i < RANDOMLY_MOVING_AGENTS; i++) {
            randomlyMovingAgent( this.grid );
        }

        console.log("Avviato game numero: ", this.id, " con mappa: ", MAP_FILE);

    }

    registerSocketAndGetAgent ( id, name, socket ) {

        const db = this.idToAgentAndSockets;
        
        // Get or create entry for id
        var entry = db.get( id );
        if ( ! entry ) {
            db.set( id, { score: 0, sockets: new Set() } );
            entry = db.get( id );
        }

        // Register socket
        entry.sockets.add( socket );

        // Get or create agent for id
        var me = this.grid.getAgent( id );
        if ( ! me ) {
            me = this.grid.createAgent( {id: id, name} );
            me.score = db.get( id ).score;
            me.on( 'score', (me) => entry.score = me.score )
        }

        return me; // Return agent given the specified id
        
    }

    printAgents(){
        console.log("Lista Agenti:", this.idToAgentAndSockets)
    }

    join( socket, me ){

        //Emit map (tiles)
        this.grid.on( 'tile', ({x, y, delivery, blocked, parcelSpawner}) => {
            // console.log( 'emit tile', x, y, delivery, parcelSpawner );
            if (!blocked)
                socket.emit( 'tile', x, y, delivery, parcelSpawner );
            else
                socket.emit( 'not_tile', x, y );
        } );

        let tiles = []
        for (const {x, y, delivery, blocked, parcelSpawner} of this.grid.getTiles()) {
            if ( !blocked ) {
                socket.emit( 'tile', x, y, delivery, parcelSpawner )
                tiles.push( {x, y, delivery, parcelSpawner} )
            } else
                socket.emit( 'not_tile', x, y );
        }
        let {width, height} = this.grid.getMapSize()
        socket.emit( 'map', width, height, tiles )


         // Emit you
        me.on( 'agent', ({id, name, x, y, score}) => {
            let idme = me.id; let nameme = me.name; let xme = me.x; let yme = me.y; let scoreme = me.score;
            //console.log("Dati agent: ",idme, nameme, xme, yme, scoreme)
            socket.emit( 'you', {idme, nameme, xme, yme, scoreme} );
        } );
        let idme = me.id; let nameme = me.name; let xme = me.x; let yme = me.y; let scoreme = me.score;
        //console.log("Dati me: ",idme, nameme, xme, yme, scoreme)
        socket.emit( 'you', {idme, nameme, xme, yme, scoreme} );


        /**
         * Emit sensing
         */

        // Parcels
        me.on( 'parcels sensing', (parcels) => {
            // console.log('emit parcels sensing', ...parcels);
            socket.emit('parcels sensing', parcels )
        } );
        me.emitParcelSensing();

        // Agents
        me.on( 'agents sensing', (agents) => {
            // console.log('emit agents sensing', ...agents); // {id, name, x, y, score}
            socket.emit( 'agents sensing', agents );
        } );
        me.emitAgentSensing();

    }



}

module.exports = Game;