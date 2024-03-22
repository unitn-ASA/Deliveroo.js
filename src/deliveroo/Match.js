const Grid = require('./Grid');
const RandomlyMoveAgent = require('../workers/randomlyMovingAgent');
const parcelsGenerator = require('../workers/parcelsGenerator');
const { uid } = require('uid');
const Config = require('./Config');
const { SensorInterface } = require('./InterfaceController');
const Agent = require('./Agent');
const Leaderboard = require('./Leaderboard');
const Timer = require('./Timer');


// enum for the status of the match
const MatchStatus = {
    STOP: 'stop',
    PLAY: 'play',
    END: 'end'
};

class Match {

    /** @type {Config} config */
    config;

     /** @type {MatchStatus} config */
    #status;
    get status () {  return this.#status; }
    set status (newStatus) {  this.#status = newStatus; }

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

    /** @type {Timer} timer of the match */
    #timer;
    get timer () { return this.#timer; }

    /**
     * @param {Config} config 
     * @param {string} id 
     */
    constructor ( config = new Config(), id = uid(4) )  {

        this.config = config;
        this.#id = id;
        this.#status = MatchStatus.STOP

        // Create and start the timer of the match
        this.#timer = new Timer(config.MATCH_TIMEOUT);

        // Load map
        let map = require( '../../levels/maps/' + this.config.MAP_FILE + '.json' );
        this.grid = new Grid( this.#id, config, map.map );

        // Parcels generator
        this.#parcelsGenerator = new parcelsGenerator( this.config, this.grid );
        
        // Randomly moving agents
        this.#randomlyMovingAgents = [];
        for (let i = 0; i < this.config.RANDOMLY_MOVING_AGENTS; i++) {
            let randomlyMoveAgent = new RandomlyMoveAgent( this.config, this.grid );
            this.#randomlyMovingAgents.push( randomlyMoveAgent );
        }

        // listeners to the event of the timer
        this.#timer.on('timer update', (remainingTime) => { 
            //console.log(remainingTime) /* print for debug */
            this.grid.emit('timer update',remainingTime);  
        })
        this.#timer.on('timer started', () => {  console.log(`/${this.#id } timer started`)  /* print for debug */ })
        this.#timer.on('timer stopped', () => { console.log(`/${this.#id } timer stopped`)   /* print for debug */ })
        this.#timer.on('timer ended', () => {
            console.log(`/${this.#id } timer ended`)
            this.#status = MatchStatus.END
            this.grid.emit('match ended', this.#id);
        })
        
    
        /* Connect match to leaderboard
        this.grid.on( 'agent rewarded', (agent, reward) => {
            Leaderboard.addReward( this.#id, agent.teamId, agent.teamName, agent.id, agent.name, reward );
        } );*/


        // // quando il punteggio di un agente cambia solleva l'evento agent info
        // this.#grid.on('agente score', (id, name, team, score) => {
        //     this.emit('agent info', id, name, team, score);
        // });

        // Logs
        console.log(`/${this.#id } created`);

        // this.on('agent info', (id, name, team, score) => {
        //     console.log("Agente ", id + " ", name + " of team:", team + " change score into ", +score)
        // });
        // this.on('team info', (name, score) => {
        //     console.log("Team ", name + " change score into ", +score)
        // });
        
    }

   
    async destroy() {

        this.#timer.stop()
        this.#timer.destroy()
        this.#timer = null; 

        // Stoppa the motion of the agent
        await Promise.all(this.#randomlyMovingAgents.map(a => a.stop()));
    
        // Destroy the generator of parcels
        await this.#parcelsGenerator.destroy();
    
        // Destroy the grid
        await this.grid.destroy();

        this.status = MatchStatus.END
    
    }

    getOrCreateAgent ( userParam = {id, name, teamId, teamName} ) {
        
        // Agent
        //console.log(this.grid.getAgents())
        var me = this.grid.getAgent( userParam.id );
        if ( ! me ){
            me = this.grid.createAgent( userParam );
        }
        
        
        // this.#teamsAgents.forEach( (agents,team) => {
        //     let teamScore = Array.from(agents).reduce( (sum,a) => a.sccore );
        //     let listOfAgentsString = Array.from( agents.values() ).map( a => a.name ).join(', ');
        //     console.log(`\t ${team} score: ${teamScore}, agents: ${listOfAgentsString}`);
        // } );

        return me;
    }

    strtStopMatch(){
        if(this.#status == MatchStatus.PLAY){ this.#status = MatchStatus.STOP; this.#timer.stop();  return; }
        if(this.#status == MatchStatus.STOP){ this.#status = MatchStatus.PLAY; this.#timer.start(); return; }
    }


}



module.exports = Match;
