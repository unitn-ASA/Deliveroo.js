const Grid = require('./Grid');
const Team = require('./Team');
const EventEmitter = require('events');
const randomlyMovingAgent = require('../workers/randomlyMovingAgent');
const parcelsGenerator = require('../workers/parcelsGenerator');
const { uid } = require('uid'); 
const { forEach } = require('../../levels/maps/challenge_21');

class Match extends EventEmitter {

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

    /**
    * @type {Map<string,Team>} teams in the match
    */
    teams = new Map()

    constructor(options, id=null)  {
        super();

        if(id == null) { 
            this.id = uid(6) 
        } else { this.id = id }

        this.options = options
        const map = require( '../../levels/maps/' + this.options.mappa );
        this.grid = new Grid( map );

        // quando il punteggio di un agente cambia solleva l'evento canging in scores
        this.grid.on('agente score', (id, name, team, score) => {
            this.emit('agent info', id, name, team, score);
        })

        parcelsGenerator( this.grid, this.options.parcels_generation_interval, this.options.parcels_max, this.options.parcel_rewar_avg, this.options.parcel_reward_variance,  this.options.parcel_decading_interval);

        for (let i = 0; i < this.options.random_mov_agents; i++) {
            randomlyMovingAgent( this.grid, this.options.random_agent_speed );
        }

        Match.mapMatch.set(this.id,this)
        console.log("Started match id: ", this.id, " with options: ", this.options);

        this.on('agent info', (id, name, team, score) => {
            console.log("Agente ", id + " ", name + " of team:", team + " change score into ", +score)
        })
        this.on('team info', (name, score) => {
            console.log("Team ", name + " change score into ", +score)
        })
    }

    registerSocketAndGetAgent ( id, name, team, socket ) {

        //const db = this.idToAgentAndSockets;

        // Get or create entry for id
        var entry = this.idToAgentAndSockets.get( id );
        var newEntry = false

        if ( ! entry ) {
            this.idToAgentAndSockets.set( id, { agent: null , sockets: new Set() } );
            entry = this.idToAgentAndSockets.get( id );
            newEntry = true;
        }

        // Register socket
        entry.sockets.add( socket );

        // Get or create agent for id
        var config = { AGENTS_OBSERVATION_DISTANCE: this.options.agents_observation_distance, PARCELS_OBSERVATION_DISTANCE: this.options.parcels_observation_distance, MOVEMENT_DURATION: this.options.movement_duration}
        var me = this.grid.getAgent( id );

        if ( ! me ) {
            me = this.grid.createAgent(id, name, team, config );
            // me.score = this.idToAgentAndSockets.get( id ).agent.score;

            // Gestione dei team
            if(team != null){
                if(this.teams.has(team)){                          // se il team è gia presente aggiungo l'agente al team
                    this.teams.get(team).addAgent(me)
                    console.log("Update team map: ")
                    this.teams.forEach( team => console.log(team.name + " score: ", team.score + " agents: ", team.agents));
                }else{                                             // se il team non è tra i team gia presenti nel match ne creo uno nuov
                    let newTeam = new Team(team);
                    newTeam.addAgent(me);
                    this.teams.set(team, newTeam);

                    this.teams.get(team).on('delete team', (name) =>{
                        this.teams.get(name).removeAllListeners();      // Rimuovi tutti i listener associati al team
                        this.teams.delete(name);
                        this.emit('team deleted', name)
                    })
    
                    this.teams.get(team).on('team score', (name, score) =>{
                        this.emit('team info', name, score)
                    })
                    this.emit('team info', newTeam.name, newTeam.score)
    
                    console.log("Update team map: ");
                    this.teams.forEach( team => console.log("\t", team.name + " score: ", team.score + " agents: ", team.agents));
                }

            }

            this.emit('agent info', me.id, me.name, me.team, me.score)
            
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

        // passo le informazione dei punteggi di tutti i team ed agent per la leaderboard, anche eventuali delet
        this.on('agent info', (id, name, team, score) => {
            socket.emit("agent info", id, name, team, score)
        })
        this.on('team info', (name, score) => {
            socket.emit("team info", name, score)
        })
        this.grid.on('agent deleted', ( who ) => {
            // console.log("Agent ", who.name + " deleted")
            if(who.team && this.teams.has(who.team)){
                this.teams.get(who.team).removeAgent(who.id)
            }
            socket.emit("agent deleted", who.id, who.team)
        })
        this.on('team deleted', (name)=>{
            // console.log("Team ", name + " deleted")
            socket.emit("team deleted", name)
        })

      
        // invio le info iniziali
        for (let team of this.teams.values()) {
            socket.emit("team info", team.name, team.score)
        }
        for (let agentSocket of this.idToAgentAndSockets.values()) {
            let agent = agentSocket.agent;
            socket.emit("agent info", agent.id, agent.name, agent.team, agent.score)
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

        /**
         * Communication
         */

        socket.on( 'say', (toId, msg, acknowledgementCallback) => {            
            console.log( me.id, me.name, 'say ', toId, msg );

            if(this.idToAgentAndSockets.has( toId )){
                for ( let socket of this.idToAgentAndSockets.get( toId ).sockets ) {
                    // console.log( me.id, me.name, 'emit \'msg\' on socket', socket.id, msg );
                    socket.emit( 'msg', me.id, me.name, msg );
                }
            }            

            try {
                if (acknowledgementCallback) acknowledgementCallback( 'successful' )
            } catch (error) { console.log( me.id, 'acknowledgement of \'say\' not possible' ) }

        } )

        socket.on( 'ask', (toId, msg, replyCallback) => {
            console.log( me.id, me.name, 'ask', toId, msg );
            if(this.idToAgentAndSockets.has( toId )){
                for ( let socket of this.idToAgentAndSockets.get( toId ).sockets ) {
                    
                    // console.log( me.id, 'socket', socket.id, 'emit msg', ...args );
                    socket.emit( 'msg', me.id, me.name, msg, (reply) => {

                        try {
                            console.log( toId, 'replied', reply );
                            replyCallback( reply )
                        } catch (error) { console.log( me.id, 'error while trying to acknowledge reply' ) }

                    } );
                }
            }
        } )

        socket.on( 'shout', (msg, acknowledgementCallback) => {
            console.log( me.id, me.name, 'shout', msg );    
            socket.broadcast.emit( 'msg', me.id, me.name, msg );
            socket.emit( 'msg', me.id, me.name, msg );
    
            try {
                if (acknowledgementCallback) acknowledgementCallback( 'successful' )
            } catch (error) { console.log( me.id, 'acknowledgement of \'shout\' not possible' ) }
            
        } )
    
    

        console.log('Socket ', socket.id + ' joint match:', this.id)

    }

}

module.exports = Match;