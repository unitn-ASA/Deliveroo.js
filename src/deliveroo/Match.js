const Grid = require('./Grid');
const randomlyMovingAgent = require('../workers/randomlyMovingAgent');
const parcelsGenerator = require('../workers/parcelsGenerator');
const { uid } = require('uid');
const Config = require('./Config');
const { SensorInterface } = require('./InterfaceController');
const Agent = require('./Agent');
const Leaderboard = require('./Leaderboard');


// enum for the status of the match
const MatchStatus = {
    STOP: 'stop',
    PLAY: 'play',
    ENDED: 'ended'
};

class Match {

    /** @type {Config} config */
    config;

     /** @type {MatchStatus} config */
    status;

    /** @type {string} #id */    
    #id;
    get id () { return this.#id; }

    /** @type {Grid} grid */
    grid;

    /** @type {parcelsGenerator} */
    #parcelsGenerator;

    /** @type {randomlyMovingAgent[]} */
    #randomlyMovingAgents;

    // /** @type {Map<string,{agent:Agent,sockets:Set<Socket>}>} idToAgentAndSockets */
    // #idToAgentAndSockets = new Map();

    /** @type {Map<string,Set<Agent>} agents in each team */
    #teamsAgents = new Map();

    /**
     * @param {Config} config 
     * @param {string} id 
     */
    constructor ( config = new Config(), id = uid(4) )  {

        this.config = config;
        this.#id = id;
        this.status = MatchStatus.PLAY

        console.log('Id match: ', this.#id)

        // Load map
        let map = require( '../../levels/maps/' + this.config.MAP_FILE + '.json' );
        this.grid = new Grid( this.#id, config, map.map );

        // Parcels generator
        this.#parcelsGenerator = new parcelsGenerator( this.config, this.grid );
        
        // Randomly moving agents
        this.#randomlyMovingAgents = [];
        for (let i = 0; i < this.config.RANDOMLY_MOVING_AGENTS; i++) {
            this.#randomlyMovingAgents.push( new randomlyMovingAgent( this.config, this.grid ) );
        }
    
        // Connect match to leaderboard
        this.grid.on( 'agent rewarded', (agent, reward) => {
            Leaderboard.addReward( this.#id, agent.team, agent.id, agent.name, reward );
        } );

        this.grid.on( 'agent created', (agent) => {
            console.log("AGENT CREATED")
            Leaderboard.addReward( this.#id, agent.team, agent.id,agent.name, 0 );
        } );

        // // quando il punteggio di un agente cambia solleva l'evento agent info
        // this.#grid.on('agente score', (id, name, team, score) => {
        //     this.emit('agent info', id, name, team, score);
        // });

        // Logs
        console.log("Started match "+this.#id);

        // this.on('agent info', (id, name, team, score) => {
        //     console.log("Agente ", id + " ", name + " of team:", team + " change score into ", +score)
        // });
        // this.on('team info', (name, score) => {
        //     console.log("Team ", name + " change score into ", +score)
        // });
        
    }

    destroy () {
        this.#parcelsGenerator.destroy();
        this.#randomlyMovingAgents.forEach( a => a.destroy() );
        this.grid.removeAllListeners( 'agent rewarded' );
        // this.grid.destroy();
    }

    getOrCreateAgent ( id, name, team = uid(4) ) {
        
        // Agent
        //console.log(this.grid.getAgents())
        var me = this.grid.getAgent( id );
        if ( ! me ){
            me = this.grid.createAgent( {id, name, team} );
        }
            
        // Team
        var teamMates = this.#teamsAgents.get( team );
        if ( ! teamMates ) {
            teamMates = new Set();
            this.#teamsAgents.set( team, teamMates );
        }
        if ( ! teamMates.has( me ) ) {
            teamMates.add( me );
        }
        
        // this.#teamsAgents.forEach( (agents,team) => {
        //     let teamScore = Array.from(agents).reduce( (sum,a) => a.sccore );
        //     let listOfAgentsString = Array.from( agents.values() ).map( a => a.name ).join(', ');
        //     console.log(`\t ${team} score: ${teamScore}, agents: ${listOfAgentsString}`);
        // } );

        return me;
    }

}



module.exports = Match;
