const Grid = require('./Grid');
const randomlyMovingAgent = require('../workers/randomlyMovingAgent');
const parcelsGenerator = require('../workers/parcelsGenerator');
const { uid } = require('uid'); 

class Match {

    /**
     * @type {Map<string, Match>} mapMatch
     */
    static mapMatch = new Map()  //lista di tutti i game attivi 

    id
    grid
    options = {}    // Opzioni per configurare la partita, essi sono:

        /*  mappa: nome della mappa della partita
            random_mov_agents: numero di boot
            random_agent_speed: la velocità dei boot
            parcels_generation_interval: intervallo di tempo tra lo spawn dei pacchi
            parcels_max: numero massimo di pacchi, 
            parcel_rewar_avg: media del valore di un pacco
            parcel_reward_variance: varianza del valore di un pacco dalla media
            parcel_decading_interval: intervallo di tempo per cui il valore del pacco decrementi di 1
            agents_observation_distance: la distanza in cui un agente riesce a vedere altri agenti --> usato in registerSocketAndGetAgent e a sua volta in Agents
            parcels_observation_distance: la distanza in cui un agente riesce a vedere altri pacchi --> usato in registerSocketAndGetAgent e a sua volta in Agents
            movement_duration: durata di uno singolo spostamento dell'agente --> usato in registerSocketAndGetAgent e a sua volta in Agents
        */

    /**
    * @type {Map<string,{agent:Agent,sockets:Set<Socket>}>} idToAgentAndSockets
    */
    idToAgentAndSockets = new Map();

    constructor(options, id=null)  {

        if(id == null) { 
            this.id = uid(6) 
        } else { this.id = id }

        this.options = options
        const map = require( '../../levels/maps/' + this.options.mappa );
        this.grid = new Grid( map );

        parcelsGenerator( this.grid, this.options.parcels_generation_interval, this.options.parcels_max, this.options.parcel_rewar_avg, this.options.parcel_reward_variance,  this.options.parcel_decading_interval);

        for (let i = 0; i < this.options.random_mov_agents; i++) {
            randomlyMovingAgent( this.grid, this.options.random_agent_speed );
        }

        Match.mapMatch.set(this.id,this)
        console.log("Avviato game numero: ", this.id, " con opzioni: ", this.options);

    }

    registerSocketAndGetAgent ( id, name, team, socket ) {

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
        var config = { AGENTS_OBSERVATION_DISTANCE: this.options.agents_observation_distance, PARCELS_OBSERVATION_DISTANCE: this.options.parcels_observation_distance, MOVEMENT_DURATION: this.options.movement_duration}
        var me = this.grid.getAgent( id );
        if ( ! me ) {
            me = this.grid.createAgent( {id: id, name, team}, config );
            me.score = db.get( id ).score;
            me.on( 'score', (me) => entry.score = me.score )
        }

        //console.log("Agente: ", me);

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


        //Emit you
        me.on( 'agent', ({id, name, team, x, y, score}) => {
            let idme = me.id; let nameme = me.name; let teamme = team; let xme = me.x; let yme = me.y; let scoreme = me.score;
            //console.log("Dati agent: ",idme, nameme, xme, yme, scoreme)
            socket.emit( 'you', {idme, nameme, teamme, xme, yme, scoreme} );
        } );
        let idme = me.id; let nameme = me.name; let teamme = me.team; let xme = me.x; let yme = me.y; let scoreme = me.score;
        //console.log("Dati agent: ",idme, nameme, xme, yme, scoreme)
        socket.emit( 'you', {idme, nameme, teamme, xme, yme, scoreme} );


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

        /**
         * GOD mod
         */
        if ( me.name == 'god' ) {

            socket.on( 'create parcel', async (x, y) => {
                console.log( 'create parcel', x, y )
                this.grid.createParcel(x, y)
            } );

            socket.on( 'dispose parcel', async (x, y) => {
                console.log( 'dispose parcel', x, y )
                let parcels = Array.from(this.grid.getParcels()).filter( p => p.x == x && p.y == y );
                for ( p of parcels)
                this.grid.deleteParcel( p.id )
                this.grid.emit( 'parcel' );
            } );

            socket.on( 'tile', async (x, y) => {
                console.log( 'create/dispose tile', x, y )
                let tile = this.grid.getTile(x, y)
                
                if ( !tile ) return;

                if ( tile.blocked ) {
                    tile.delivery = false;
                    tile.parcelSpawner = true;
                    tile.unblock();
                } else if ( tile.parcelSpawner ) {
                    tile.delivery = true;
                    tile.parcelSpawner = false;
                } else if ( tile.delivery ) {
                    tile.delivery = false;
                    tile.parcelSpawner = false;
                } else {
                    tile.delivery = false;
                    tile.parcelSpawner = false;
                    tile.block();
                }
            } );

        }

        console.log('Socket ', socket.id + ' entrata nel match:', this.id)

    }



}

module.exports = Match;