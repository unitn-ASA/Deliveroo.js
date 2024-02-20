const Grid = require('./Grid');
const Team = require('./Team');
const EventEmitter = require('events');
const randomlyMovingAgent = require('../workers/randomlyMovingAgent');
const parcelsGenerator = require('../workers/parcelsGenerator');
const { uid } = require('uid'); 
const { forEach } = require('../../levels/maps/challenge_21');
const Config = require('./Config');

class Match extends EventEmitter {

    /**
     * @type {Map<string, Match>} mapMatch
     */
    static mapMatch = new Map()  //lista di tutti i game attivi 

    /**
     * @type {string} id
     */    
    id

    /**
     * @type {Grid} grid
     */
    grid

    /**
     * @type {Config} config
     */
    config

    /**
    * @type {Map<string,{agent:Agent,sockets:Set<Socket>}>} idToAgentAndSockets
    */
    idToAgentAndSockets = new Map();

    /**
    * @type {Map<string,Team>} teams in the match
    */
    teams = new Map()

    constructor( config = new Config(), id = null )  {
        super();

        if(id == null) { 
            this.id = uid(6) 
        } else { this.id = id }

        this.config = config;
        const map = require( '../../levels/maps/' + this.config.MAP_FILE + '.json' ).map;
        this.grid = new Grid( map );

        // quando il punteggio di un agente cambia solleva l'evento canging in scores
        this.grid.on('agente score', (id, team, score) => {
            this.emit('changing in agent info', id, team, score);
        })

        parcelsGenerator( this.grid, this.config);

        for (let i = 0; i < this.config.RANDOMLY_MOVING_AGENTS; i++) {
            randomlyMovingAgent( this.grid, this.config.RANDOM_AGENT_SPEED );
        }

        Match.mapMatch.set(this.id,this)
        console.log("Avviato game numero: ", this.id, " con opzioni: ", this.config);

        this.on('changing in agent info', (id, team, score) => {
            console.log("Agente ", id + " of team:", team + " change score into ", +score)
        })
        this.on('changing in team info', (name, score) => {
            console.log("Team ", name + " change score into ", +score)
        })
    }

    registerSocketAndGetAgent ( id, name, team, socket ) {

        //const db = this.idToAgentAndSockets;

        // Get or create entry for id
        var entry = this.idToAgentAndSockets.get( id );
        var newEntry = false

        if ( ! entry ) {
            this.idToAgentAndSockets.set( id, { agent: {score: 0}, sockets: new Set() } );
            entry = this.idToAgentAndSockets.get( id );
            newEntry = true;
        }

        // Register socket
        entry.sockets.add( socket );

        // Get or create agent for id
        var me = this.grid.getAgent( id );

        if ( ! me ) {
            me = this.grid.createAgent( {id: id, name, team}, this.config );
            me.score = this.idToAgentAndSockets.get( id ).agent.score;

            // Gestione dei team
            if(team != "" && this.teams.has(team)){            // se il team è gia presente aggiungo l'agente al team
                this.teams.get(team).addAgent(me)
                console.log("Update team map: ")
                this.teams.forEach( team => console.log(team.name + " score: ", team.score + " agents: ", team.agents));
            }else{                                             // se il team non è tra i team gia presenti nel match ne creo uno nuov
                let newTeam = new Team(team);
                newTeam.addAgent(me);
                this.teams.set(team, newTeam);

                this.teams.get(team).on('team score', (name, score) =>{
                    this.emit('changing in team info', name, score)
                })
                this.emit('changing in team info', team, 0)

                console.log("Update team map: ");
                this.teams.forEach( team => console.log("\t", team.name + " score: ", team.score + " agents: ", team.agents));
            }

            this.emit('changing in agent info', name, team, 0);
            console.log("\n")
        }

        if(newEntry){
            entry.agent = me;
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


        //Emit you
        me.on( 'agent', ({id, name, team, x, y, score}) => {
            let idme = me.id; let nameme = me.name; let teamme = team; let xme = me.x; let yme = me.y; let scoreme = me.score;
            //console.log("Dati agent: ",idme, nameme, xme, yme, scoreme)
            socket.emit( 'you', {idme, nameme, teamme, xme, yme, scoreme} );
        } );
        let idme = me.id; let nameme = me.name; let teamme = me.team; let xme = me.x; let yme = me.y; let scoreme = me.score;
        //console.log("Dati agent: ",idme, nameme, xme, yme, scoreme)
        socket.emit( 'you', {idme, nameme, teamme, xme, yme, scoreme} );

        this.on('changing in agent info', (id, team, score) => {
            socket.emit("changing in agent info", id, team, score)
        })
        this.on('changing in team info', (name, score) => {
            socket.emit("changing in team info", name, score)
        })

      
        // invio le info iniziali
        for (let team of this.teams.values()) {
            socket.emit("changing in team info", team.name, team.score)
        }
        for (let agentSocket of this.idToAgentAndSockets.values()) {
            let agent = agentSocket.agent;
            socket.emit("changing in agent info", agent.id, agent.team, agent.score)
        }
        
        
        

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